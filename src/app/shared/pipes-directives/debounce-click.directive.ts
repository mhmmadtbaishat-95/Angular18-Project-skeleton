import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

/**
 * Debounce click directive
 * Prevents rapid successive clicks by debouncing click events
 */
@Directive({
  selector: '[appDebounceClick]',
  standalone: true
})
export class DebounceClickDirective {
  @Input() debounceTime = 300;
  @Output() debouncedClick = new EventEmitter<MouseEvent>();
  private readonly clicks$ = new Subject<MouseEvent>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.clicks$
      .pipe(
        debounceTime(this.debounceTime),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => this.debouncedClick.emit(event));
  }

  /**
   * Listens to click events
   * @param event - Mouse event
   */
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.clicks$.next(event);
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

