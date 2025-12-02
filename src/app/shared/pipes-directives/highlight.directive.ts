import { Directive, ElementRef, Input, OnInit, Renderer2, inject } from '@angular/core';

/**
 * Highlight directive
 * Highlights element text with a background color
 */
@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  @Input() appHighlight = 'yellow';
  @Input() highlightColor = 'yellow';

  ngOnInit(): void {
    const color = this.appHighlight || this.highlightColor;
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      'background-color',
      color
    );
  }
}

