import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-skeleton-loader.component.html',
  styleUrls: ['./table-skeleton-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSkeletonLoaderComponent implements OnChanges {
  /** Show skeleton when true */
  @Input() isLoading = false;

  /** Number of table rows to render */
  @Input() rows = 8;

  /** Number of table columns to render */
  @Input() columns = 5;

  /** Render a header skeleton row */
  @Input() showHeader = true;

  /** Enable shimmer animation */
  @Input() animate = true;

  /** Compact rows */
  @Input() dense = false;

  /** Text direction awareness */
  @Input() dir: 'ltr' | 'rtl' | 'auto' = 'auto';

  /** Optional per-column widths, e.g., ['120px', '30%', '1fr', '8rem'] */
  @Input() columnWidths?: Array<string | number>;

  colsArray: number[] = [];
  rowsArray: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.colsArray = Array.from({ length: Math.max(1, this.columns) }, (_, i) => i);
    this.rowsArray = Array.from({ length: Math.max(1, this.rows) }, (_, i) => i);
  }

  getColWidthStyle(index: number): string | null {
    if (!this.columnWidths || !this.columnWidths[index]) return null;
    const v = this.columnWidths[index];
    return typeof v === 'number' ? `${v}px` : v;
  }
}
