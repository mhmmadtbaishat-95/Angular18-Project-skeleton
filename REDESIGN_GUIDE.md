# Website Redesign Guide - Qatar Cityscape Theme

## Overview
This guide documents the redesign of your Angular application to match the modern modal-based login/register design with Qatar cityscape background, as shown in the reference image.

## Files Modified/Created

### 1. **New Auth Layout Component**
**File**: `src/app/layout/auth-layout/auth-layout.component.ts`

This is a new standalone component that provides the background image layout for auth pages:
- Full-screen background image with dark overlay
- Centered content area for login/register modals
- Responsive design support

**Usage**:
```typescript
// In your auth routes
path: 'auth',
component: AuthLayoutComponent,
children: [
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage }
]
```

### 2. **Updated Login Component**
**Files**:
- `src/app/features/auth/components/login/login.component.html`
- `src/app/features/auth/components/login/login.component.scss`

**New Features**:
- Modern modal-style card with white semi-transparent background
- Two prominent red buttons (Sign In + Create Account)
- Close button in top-right corner
- Proper form validation with error messages
- RTL support for Arabic language
- Translation-ready with i18n keys

**Key Classes**:
- `.login-container` - Main wrapper
- `.modal-header` - Top section with close button and titles
- `.modal-card` - White card container
- `.form-input` - Styled input fields
- `.btn-primary-large` - Primary action button (Sign In)
- `.btn-secondary-large` - Secondary action button (Create Account)

### 3. **Background Video Setup**
Your Doha Qatar video has been added to:
```
src/assets/6515549_Doha_Qatar_3840x2160 1.mp4
```

The AuthLayoutComponent automatically uses this video with:
- **Autoplay**: Starts playing when page loads
- **Muted**: No audio to avoid jarring user experience
- **Loop**: Continuously plays for seamless experience
- **4K Resolution**: Full 3840x2160 dimensions
- **Dark Overlay**: 40% black overlay for text readability

## CSS/Tailwind Configuration

### New Color Added to Tailwind
Add to your `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'qatar-maroon': '#8B1538',
        'qatar-maroon-dark': '#6B0F2A',
      }
    }
  }
}
```

## Translation Keys Needed

Add these keys to your `en.json` and `ar.json` translation files:

```json
{
  "auth": {
    "login": {
      "title": "Sign in to your account",
      "subtitle": "Or create a new account",
      "email": "Email address",
      "emailPlaceholder": "Enter your email",
      "emailRequired": "Email is required",
      "emailInvalid": "Please enter a valid email",
      "password": "Password",
      "passwordPlaceholder": "Enter your password",
      "passwordRequired": "Password is required",
      "rememberMe": "Remember me",
      "forgotPassword": "Forgot your password?",
      "signIn": "Sign in",
      "signingIn": "Signing in..."
    },
    "register": {
      "createAccount": "Create Account",
      "title": "Create your account",
      "subtitle": "Already have an account? Sign in"
    }
  }
}
```

## Next Steps - Not Yet Implemented

### 1. **Update Auth Routes**
```typescript
// src/app/features/auth/auth.routes.ts
export const authRoutes = [
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: 'register',
    component: RegisterPage
  }
];

// src/app/core/routing/app.routes.ts
{
  path: 'auth',
  component: AuthLayoutComponent,
  children: authRoutes
}
```

### 2. **Register Component**
Apply the same modal design to `src/app/features/auth/components/register/` with:
- Same modal-card styling
- Two buttons: "Create Account" + "Sign In"
- Additional fields: First Name, Last Name, Username
- Password confirmation field
- Terms & conditions checkbox

### 3. **Main Shell Layout**
Keep the existing sidebar/header layout for authenticated users, but optimize it:
- Remove footer if not needed
- Make sidebar collapsible by default on mobile
- Ensure consistent dark mode support

### 4. **Global Styles**
Add to your global styles file or Tailwind config:

```scss
// Common input styling
.form-input {
  @apply w-full px-4 py-3 border border-gray-300 rounded-lg;
  @apply text-gray-900 placeholder-gray-500;
  @apply focus:outline-none focus:ring-2 focus:ring-qatar-maroon;
}

// Button styles
.btn-primary-large,
.btn-secondary-large {
  @apply px-6 py-3 font-semibold rounded-lg transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary-large {
  @apply bg-qatar-maroon text-white hover:bg-qatar-maroon-dark;
}

.btn-secondary-large {
  @apply bg-qatar-maroon text-white hover:bg-qatar-maroon-dark;
}
```

## Design System Summary

### Color Palette
- **Primary**: Qatar Maroon (#8B1538)
- **Primary Dark**: #6B0F2A
- **Background**: White with semi-transparent overlay
- **Text**: Dark gray for contrast
- **Accent**: Blue for links

### Typography
- **Titles**: Bold, 20-24px
- **Body**: Regular, 14-16px
- **Labels**: Medium, 13-14px

### Spacing
- Modal padding: 32px
- Form field spacing: 24px
- Button height: 48px (py-3)

### Shadows
- Modal: `shadow-2xl`
- Buttons on hover: `shadow-lg`
- Overall: Modern, subtle shadows for depth

## RTL Support

All components include RTL support using:
- `:host-context(.rtl)` selector for component-specific RTL rules
- `flex-row-reverse` for reversing flex direction
- `left` instead of `right` for RTL positioning

This works with your existing i18n setup that applies the `rtl` class to the body element.

## Complete Implementation Status

### ✅ Completed
1. **Background video integrated across entire portal** ✅
   - Video plays on both auth pages (login/register) and main portal (dashboard/services)
   - Video file: `src/assets/6515549_Doha_Qatar_3840x2160 1.mp4`
   - AuthLayoutComponent and ShellComponent both use the video

2. **Auth Layout with Header & Sidebar** ✅
   - AuthLayoutComponent now includes header, sidebar, and footer
   - Login modal is centered in the main content area
   - Consistent layout across auth and portal pages

3. **Auth Routes Updated** ✅
   - Routes properly nested under AuthLayoutComponent
   - Login and register pages wrapped with auth layout

4. **Video Background on Main Portal** ✅
   - ShellComponent displays video background on all authenticated pages
   - Header and sidebar visible over video

### Remaining Tasks
1. **Implement register component** - Apply same modal design to register page
2. **Add translation keys** - Add auth.login and auth.register keys to en.json and ar.json
3. **Update Tailwind config** - Add qatar-maroon colors to tailwind.config.js
4. **Test RTL** - Verify layout in Arabic
5. **Test video playback** - Cross-browser and device testing

## File Structure
```
src/
├── app/
│   ├── layout/
│   │   ├── auth-layout/
│   │   │   └── auth-layout.component.ts (NEW)
│   │   ├── sidebar/
│   │   ├── header/
│   │   └── footer/
│   └── features/
│       └── auth/
│           ├── components/
│           │   ├── login/
│           │   │   ├── login.component.html (UPDATED)
│           │   │   ├── login.component.ts
│           │   │   └── login.component.scss (UPDATED)
│           │   └── register/
│           │       ├── register.component.html
│           │       ├── register.component.ts
│           │       └── register.component.scss
│           ├── pages/
│           │   ├── login.page.ts
│           │   └── register.page.ts
│           └── auth.routes.ts
└── assets/
    └── 6515549_Doha_Qatar_3840x2160 1.mp4 (VIDEO BACKGROUND)
```

## Testing Checklist

- [ ] Login modal displays correctly on desktop
- [ ] Login modal is responsive on mobile
- [ ] Background video plays smoothly
- [ ] Video is muted (no audio plays)
- [ ] Video loops continuously
- [ ] 40% dark overlay is applied correctly
- [ ] Modal content is readable over video
- [ ] Both buttons work correctly
- [ ] Form validation works
- [ ] Close button closes modal (if implemented)
- [ ] Arabic translation keys all render correctly
- [ ] RTL layout mirrors properly with video background
- [ ] Dark mode doesn't interfere with modal
- [ ] Create Account button navigates to register page
- [ ] Sign In button submits the form
- [ ] Video loads on first page visit (no blank screen)

