import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@shared/pipes-directives/translate.pipe';
import { environment } from '../../../../environments/environment';

declare var mapboxgl: any;

export interface LandDetails {
  latitude: number;
  longitude: number;
  address: string;
  plotNumber: string;
  area: string;
  cadastralNumber?: string;
}

/**
 * Map selector component for selecting land location
 */
@Component({
  selector: 'app-map-selector',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './map-selector.component.html',
  styleUrls: ['./map-selector.component.scss']
})
export class MapSelectorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @Output() landSelected = new EventEmitter<LandDetails>();

  private map: any;
  private marker: any;
  isMapLoaded = signal(false);
  mapError = signal(false);
  
  // Default location: Lusail City, Qatar
  private readonly defaultLat = 25.4200;
  private readonly defaultLng = 51.5000;
  
  // Static land details (pre-populated)
  private readonly staticLandDetails: LandDetails = {
    latitude: 25.4200,
    longitude: 51.5000,
    address: 'لوسيل، الدوحة، قطر',
    plotNumber: '1234/2024',
    area: 'لوسيل',
    cadastralNumber: 'QAT-2024-1234'
  };

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    // Wait for Mapbox to be available and container to be ready
    this.waitForMapbox(() => {
      if (this.mapContainer && this.mapContainer.nativeElement) {
        this.initMap();
      } else {
        console.error('Map container not found');
        this.isMapLoaded.set(true);
        this.landSelected.emit(this.staticLandDetails);
      }
    });
  }

  /**
   * Wait for Mapbox GL JS to be loaded
   */
  private waitForMapbox(callback: () => void, maxAttempts = 20, attempt = 0): void {
    if (typeof mapboxgl !== 'undefined') {
      callback();
      return;
    }

    if (attempt >= maxAttempts) {
      console.error('Mapbox GL JS failed to load after multiple attempts');
      this.isMapLoaded.set(true);
      this.landSelected.emit(this.staticLandDetails);
      return;
    }

    setTimeout(() => {
      this.waitForMapbox(callback, maxAttempts, attempt + 1);
    }, 200);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  /**
   * Initialize Mapbox map
   */
  private initMap(): void {
    // Check if mapboxgl is available
    if (typeof mapboxgl === 'undefined') {
      console.error('Mapbox GL JS is not loaded. Please check the script tag in index.html');
      // Wait a bit and try again
      setTimeout(() => {
        if (typeof mapboxgl !== 'undefined') {
          this.initMap();
        } else {
          // Still not loaded, show error and emit static data
          this.isMapLoaded.set(true); // Hide loading spinner
          this.landSelected.emit(this.staticLandDetails);
        }
      }, 1000);
      return;
    }

    try {
      // Use token from environment or fallback to demo token
      const token = 'pk.eyJ1IjoibXR1YmlzaGF0OTgiLCJhIjoiY21rNWd4Ymo3MGFvaTNnc2hybzJxcWZxcyJ9.HAQqUsR0AfQ0itQgvW7N5w'
      mapboxgl.accessToken = token;
      
      // Check if token is set
      if (!mapboxgl.accessToken) {
        console.error('Mapbox access token is not set. Please add your token to environment.ts');
        this.isMapLoaded.set(true);
        this.landSelected.emit(this.staticLandDetails);
        return;
      }

      console.log('Initializing map with token:', token.substring(0, 20) + '...');

      // Ensure container has dimensions
      const container = this.mapContainer.nativeElement;
      if (!container.offsetWidth || !container.offsetHeight) {
        console.warn('Map container has no dimensions, setting defaults');
        container.style.width = '100%';
        container.style.height = '400px';
      }

      // Ensure container is visible
      container.style.display = 'block';
      container.style.visibility = 'visible';
      container.style.opacity = '1';

      console.log('Creating map with container dimensions:', {
        width: container.offsetWidth,
        height: container.offsetHeight,
        token: token.substring(0, 20) + '...'
      });

      this.map = new mapboxgl.Map({
        container: container,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [this.defaultLng, this.defaultLat],
        zoom: 12,
        attributionControl: true,
        antialias: true
      });

      console.log('Map instance created:', this.map);

      // Force resize after a short delay to ensure container is ready
      setTimeout(() => {
        if (this.map) {
          this.map.resize();
          // Also try to trigger a repaint
          this.map.triggerRepaint();
        }
      }, 100);

      // Additional resize after longer delay
      setTimeout(() => {
        if (this.map) {
          this.map.resize();
        }
      }, 500);

      // Handle map load
      this.map.on('load', () => {
        console.log('Map loaded successfully');
        this.mapError.set(false);
        
        // Multiple resize attempts to ensure map renders
        setTimeout(() => {
          if (this.map) {
            this.map.resize();
            this.map.triggerRepaint();
            console.log('Map resized after load');
          }
        }, 50);
        
        setTimeout(() => {
          if (this.map) {
            this.map.resize();
            console.log('Map resized again');
          }
        }, 200);
        
        this.isMapLoaded.set(true);
        this.addMarker(this.defaultLat, this.defaultLng);
        // Emit initial land details
        this.landSelected.emit(this.staticLandDetails);
      });

      // Also handle style load (sometimes needed)
      this.map.on('style.load', () => {
        console.log('Map style loaded');
        setTimeout(() => {
          if (this.map) {
            this.map.resize();
            this.map.triggerRepaint();
          }
        }, 50);
      });

      // Handle render event to ensure map is visible
      this.map.on('render', () => {
        if (!this.isMapLoaded()) {
          this.isMapLoaded.set(true);
        }
      });

      // Handle idle event (map is fully loaded and rendered)
      this.map.on('idle', () => {
        console.log('Map is idle (fully loaded)');
        if (this.map) {
          this.map.resize();
        }
      });

      // Handle map errors
      this.map.on('error', (e: any) => {
        console.error('Map error:', e);
        console.error('Error details:', {
          error: e.error,
          message: e.message,
          status: e.status,
          url: e.url,
          type: e.type
        });
        
        // Check if it's an authentication error
        if (e.error && (e.error.message?.includes('token') || e.error.message?.includes('Unauthorized'))) {
          console.error('Mapbox token error - please check your token');
        }
        
        this.mapError.set(true);
        this.isMapLoaded.set(true); // Hide loading spinner even on error
        // Emit static data on error
        this.landSelected.emit(this.staticLandDetails);
      });

      // Handle data loading errors
      this.map.on('data', (e: any) => {
        if (e.isSourceLoaded && e.sourceId) {
          console.log('Map data loaded for source:', e.sourceId);
        }
      });

      // Add click handler to map
      this.map.on('click', (e: any) => {
        const { lng, lat } = e.lngLat;
        this.addMarker(lat, lng);
        this.onLocationSelected(lat, lng);
      });

      // Add navigation controls
      try {
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      } catch (e) {
        console.warn('Could not add navigation control:', e);
      }
      
      // Add geolocate control
      try {
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        });
        this.map.addControl(geolocate, 'top-right');
      } catch (e) {
        console.warn('Could not add geolocate control:', e);
      }

      // Timeout fallback - if map doesn't load in 10 seconds, hide loading
      setTimeout(() => {
        if (!this.isMapLoaded()) {
          console.warn('Map loading timeout - hiding loading indicator');
          this.isMapLoaded.set(true);
          this.landSelected.emit(this.staticLandDetails);
        }
      }, 10000);

    } catch (error) {
      console.error('Error initializing map:', error);
      this.isMapLoaded.set(true); // Hide loading spinner
      // Fallback: emit static data even if map fails
      this.landSelected.emit(this.staticLandDetails);
    }
  }

  /**
   * Add marker to map
   */
  private addMarker(lat: number, lng: number): void {
    // Remove existing marker
    if (this.marker) {
      this.marker.remove();
    }

    // Add new marker
    this.marker = new mapboxgl.Marker({
      color: '#8B1538', // Qatar maroon color
      draggable: true
    })
      .setLngLat([lng, lat])
      .addTo(this.map);

    // Handle marker drag end
    this.marker.on('dragend', () => {
      const lngLat = this.marker.getLngLat();
      this.onLocationSelected(lngLat.lat, lngLat.lng);
    });
  }

  /**
   * Handle location selection
   */
  private onLocationSelected(lat: number, lng: number): void {
    // For now, use static data (can be replaced with reverse geocoding API later)
    const landDetails: LandDetails = {
      ...this.staticLandDetails,
      latitude: lat,
      longitude: lng
    };

    this.landSelected.emit(landDetails);
  }

  /**
   * Get current selected location
   */
  getCurrentLocation(): LandDetails {
    if (this.marker) {
      const lngLat = this.marker.getLngLat();
      return {
        ...this.staticLandDetails,
        latitude: lngLat.lat,
        longitude: lngLat.lng
      };
    }
    return this.staticLandDetails;
  }
}
