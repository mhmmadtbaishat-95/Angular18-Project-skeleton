# Store System

A simple state management solution that hides RxJS complexity. Perfect for skeleton projects that need lightweight state management.

## Features

- ✅ **Simple API** - No need to understand RxJS
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Reactive** - Automatically updates components
- ✅ **Lightweight** - Minimal overhead
- ✅ **Easy to use** - Just inject and use

## Available Stores

### 1. `AuthStore` - Authentication State
Manages user authentication state.

### 2. `AppStore` - Application State  
Manages global app settings (theme, language, sidebar).

### 3. `BaseStore` - Base Class
Extend this to create custom stores for features.

## Usage Examples

### Basic Usage in Component

```typescript
import { Component, inject } from '@angular/core';
import { AuthStore } from '@data/stores/auth.store';
import { AppStore } from '@data/stores/app.store';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <p>User: {{ user$ | async }}</p>
      <p>Theme: {{ theme$ | async }}</p>
      <button (click)="authStore.setUser(user)">Login</button>
    </div>
  `
})
export class MyComponent {
  // Inject stores
  authStore = inject(AuthStore);
  appStore = inject(AppStore);

  // Get observables (auto-updates when state changes)
  user$ = this.authStore.select(state => state.user);
  theme$ = this.appStore.select(state => state.theme);
  
  // Get current values (synchronous)
  get user() {
    return this.authStore.user;
  }
  
  get isAuthenticated() {
    return this.authStore.isAuthenticated;
  }
}
```

### Using with Signals (Angular 18+)

```typescript
import { Component, inject, signal, computed } from '@angular/core';
import { AuthStore } from '@data/stores/auth.store';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  template: `
    <div>
      @if (isAuthenticated()) {
        <p>Welcome, {{ user()?.firstName }}!</p>
      }
    </div>
  `
})
export class MyComponent {
  authStore = inject(AuthStore);
  
  // Convert observable to signal
  user = toSignal(this.authStore.select(state => state.user));
  isAuthenticated = toSignal(
    this.authStore.select(state => state.isAuthenticated),
    { initialValue: false }
  );
  
  // Computed signal
  userName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : 'Guest';
  });
}
```

### Updating State

```typescript
// Update state
authStore.setUser(user);
authStore.setLoading(true);
authStore.setError('Something went wrong');

// Update multiple properties
authStore.update({
  user: newUser,
  isAuthenticated: true,
  isLoading: false
});

// App store
appStore.setTheme('dark');
appStore.setLanguage('ar');
appStore.toggleSidebar();
```

### Creating Custom Store

```typescript
import { Injectable } from '@angular/core';
import { BaseStore } from './base.store';

interface MyFeatureState {
  items: string[];
  isLoading: boolean;
  selectedItem: string | null;
}

@Injectable({ providedIn: 'root' })
export class MyFeatureStore extends BaseStore<MyFeatureState> {
  constructor() {
    super({
      items: [],
      isLoading: false,
      selectedItem: null
    });
  }

  // Add custom methods
  addItem(item: string) {
    const items = [...this.state.items, item];
    this.update({ items });
  }

  selectItem(item: string) {
    this.update({ selectedItem: item });
  }

  reset() {
    this.set({
      items: [],
      isLoading: false,
      selectedItem: null
    });
  }
}
```

## Store Methods

All stores extend `BaseStore` and provide these methods:

### State Access
- `state` - Get current state (synchronous)
- `state$` - Observable of state (reactive)
- `select(selector)` - Select specific property (observable)
- `selectCurrent(selector)` - Get current value (synchronous)

### State Updates
- `update(updates)` - Merge partial updates
- `set(newState)` - Replace entire state
- `reset()` - Reset to initial state

## Benefits

1. **No RxJS Knowledge Required** - Simple API hides complexity
2. **Type Safe** - Full TypeScript intellisense
3. **Reactive** - Components auto-update when state changes
4. **Lightweight** - Minimal bundle size
5. **Easy Migration** - Can easily migrate to NgRx/SignalStore later

## When to Use

- ✅ Small to medium apps
- ✅ Simple state management needs
- ✅ Team not familiar with RxJS
- ✅ Want lightweight solution

## When NOT to Use

- ❌ Complex state with many interactions
- ❌ Need time-travel debugging
- ❌ Need complex middleware
- ❌ Very large applications (consider NgRx)

