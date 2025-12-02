import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

/**
 * Base store class
 * Simple state management that hides RxJS complexity
 * 
 * @example
 * class UserStore extends BaseStore<UserState> {
 *   constructor() {
 *     super({ name: '', email: '' });
 *   }
 *   
 *   // Optional: Add custom methods
 *   setName(name: string) {
 *     this.update({ name });
 *   }
 * }
 */
export abstract class BaseStore<T> {
  private readonly stateSubject: BehaviorSubject<T>;
  public readonly state$: Observable<T>;

  constructor(initialState: T) {
    this.stateSubject = new BehaviorSubject<T>(initialState);
    this.state$ = this.stateSubject.asObservable();
  }

  /**
   * Get current state value
   */
  get state(): T {
    return this.stateSubject.value;
  }

  /**
   * Update state (merges with current state)
   * @param updates - Partial state updates
   * 
   * @example
   * store.update({ isLoading: true });
   */
  update(updates: Partial<T>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...updates });
  }

  /**
   * Set entire state (replaces current state)
   * @param newState - Complete new state
   * 
   * @example
   * store.set({ name: 'John', email: 'john@example.com' });
   */
  set(newState: T): void {
    this.stateSubject.next(newState);
  }

  /**
   * Reset state to initial value
   */
  reset(): void {
    // This will be overridden by child classes
    throw new Error('reset() must be implemented by child class');
  }

  /**
   * Select a specific property from state
   * Returns an observable that only emits when the selected value changes
   * 
   * @param selector - Function to select a property from state
   * 
   * @example
   * const isLoading$ = store.select(state => state.isLoading);
   */
  select<R>(selector: (state: T) => R): Observable<R> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }

  /**
   * Get a specific property from current state
   * 
   * @param selector - Function to select a property from state
   * 
   * @example
   * const isLoading = store.selectCurrent(state => state.isLoading);
   */
  selectCurrent<R>(selector: (state: T) => R): R {
    return selector(this.state);
  }
}

