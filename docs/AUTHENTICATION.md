# Authentication Integration Guide

This guide explains the standardized authentication flows in the Customizer and how external systems can integrate with it.

## Table of Contents

- [Overview](#overview)
- [Authentication Platforms](#authentication-platforms)
- [For External Systems](#for-external-systems)
- [Internal Usage](#internal-usage)
- [Auto-Detection System](#auto-detection-system)
- [API Reference](#api-reference)

---

## Overview

The Customizer supports multiple authentication strategies, all managed through a centralized flow:

1. **Self-hosted authentication** (`platform: 'self'`) - Built-in login/register system
2. **External URL redirect** (`login_code.type: 'url'`) - Redirect to external auth page
3. **Custom code execution** (`login_code.type: 'code'`) - Execute custom authentication logic
4. **External localStorage integration** - Automatic detection of externally-set credentials

All authentication flows are standardized through the `useSignIn` composable and the `useAuthStore`.

---

## Authentication Platforms

### Self-Hosted (`platform: 'self'`)

Uses the built-in authentication system with email/password.

```typescript
// User clicks sign in button
openSignInDialog() // Opens sign-in dialog

// User submits credentials
await handleSignIn() // Calls authStore.login()

// On success:
// - Sets customer and tokens in store
// - Saves to localStorage
// - Closes dialog
// - Fetches user's cart
```

### External URL (`login_code.type: 'url'`)

Redirects to an external authentication URL.

```typescript
// User clicks sign in button
// Redirects to: company.login_code.action
window.location.href = 'https://example.com/login'

// After external auth, user is redirected back with tokens
// Tokens are typically set via URL params or localStorage
```

### Custom Code (`login_code.type: 'code'`)

Executes custom JavaScript for authentication.

```typescript
// User clicks sign in button
// Executes: company.login_code.action (custom JS code)

// Example custom code:
;`
  // Parent window sets auth data
  localStorage.setItem('jwtToken', parentWindow.authToken);
  localStorage.setItem('customer', JSON.stringify(parentWindow.customer));
`

// After code executes, localStorage listener automatically detects and hydrates auth
```

---

## For External Systems

External systems (parent windows, iframe hosts, external scripts) can authenticate users in the Customizer using two approaches:

### Approach 1: Using the Global API (Recommended)

```javascript
// Check if customizer is ready
if (window.customizerApi) {
  // Method 1: Set credentials directly
  await window.customizerApi.auth.setCredentials({
    jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    customer: {
      id: 123,
      email: 'user@example.com',
      first_name: 'John',
      last_name: 'Doe'
      // ... other customer fields
    }
  })

  // Method 2: Set localStorage then trigger check
  localStorage.setItem('jwtToken', token)
  localStorage.setItem('customer', JSON.stringify(customer))
  await window.customizerApi.auth.checkAuth()

  // Check authentication status
  if (window.customizerApi.auth.isAuthenticated()) {
    console.log('User authenticated:', window.customizerApi.auth.getCustomer())
  }

  // Logout user
  window.customizerApi.auth.logout()
}
```

### Approach 2: Direct localStorage (Auto-Detection)

Simply set the values in localStorage, and the Customizer will automatically detect and hydrate:

```javascript
// External system sets auth data
localStorage.setItem('jwtToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
localStorage.setItem(
  'customer',
  JSON.stringify({
    id: 123,
    email: 'user@example.com',
    first_name: 'John',
    last_name: 'Doe'
    // ... other customer fields
  })
)

// Customizer automatically detects within 500ms
// No further action needed!
```

### Customer Object Structure

```typescript
interface Customer {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  company?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  // ... additional fields as needed
}
```

---

## Internal Usage

### Using the `useSignIn` Composable

```typescript
import { useSignIn } from '@/composables/useSignIn'

const {
  // State
  isAuthenticated,
  customer,
  customerInitials,
  isLoading,
  authError,

  // Methods
  openSignInDialog,
  handleSignIn,
  handleLogout,
  checkAuthFromStorage
} = useSignIn()

// Open sign-in dialog (respects platform configuration)
openSignInDialog()

// Check authentication from localStorage
await checkAuthFromStorage()

// Logout with options
handleLogout({ clearAllStorage: true })
```

### Using the `useAuthStore` Directly

```typescript
import { useAuthStore } from '@/stores/auth/auth.store'

const authStore = useAuthStore()

// Manual auth state management
authStore.setCustomer(customer)
authStore.setAccessToken(token)
await authStore.saveToLocalStorage()

// Start/stop listening for external auth
authStore.startListeningForAuth()
authStore.stopListeningForAuth()

// Hydrate from localStorage
await authStore.loadFromLocalStorage({ force: true })
```

---

## Auto-Detection System

The Customizer includes an automatic authentication detection system that monitors localStorage for auth credentials.

### How It Works

1. **Automatic Start**: Listener starts automatically when:
   - App initializes and user is NOT authenticated
   - User logs out (restarts listening)
   - `login_code.type === 'code'` is executed

2. **Detection Strategies**:
   - **Storage Events**: Detects changes from other tabs/windows
   - **Polling (500ms)**: Detects same-window changes from external scripts

3. **Automatic Stop**: Listener stops when:
   - Authentication is detected
   - 5 minutes elapse (safety timeout)
   - User explicitly stops it

### Manual Control

```typescript
import { useAuthStore } from '@/stores/auth/auth.store'

const authStore = useAuthStore()

// Start listening manually
authStore.startListeningForAuth()

// Stop listening manually
authStore.stopListeningForAuth()
```

---

## API Reference

### Global API: `window.customizerApi`

#### `auth.isAuthenticated(): boolean`

Check if user is currently authenticated.

#### `auth.getCustomer(): Customer | null`

Get the current authenticated customer.

#### `auth.setCredentials(credentials: AuthCredentials): Promise<boolean>`

Set authentication credentials and trigger hydration.

**Parameters:**

- `credentials.jwtToken` (string) - JWT access token
- `credentials.customer` (Customer) - Customer object
- `credentials.refreshToken` (string, optional) - Refresh token

**Returns:** Promise that resolves to `true` if authentication succeeds.

#### `auth.checkAuth(): Promise<boolean>`

Manually trigger authentication check from localStorage.

**Returns:** Promise that resolves to `true` if authentication succeeds.

#### `auth.startListening(): void`

Start listening for localStorage changes.

#### `auth.stopListening(): void`

Stop listening for localStorage changes.

#### `auth.logout(options?): void`

Logout the current user.

**Parameters:**

- `options.clearAllStorage` (boolean, optional) - Clear all localStorage. Default: `false`

---

## Flow Diagrams

### Self-Hosted Authentication Flow

```
User clicks "Sign In"
    ↓
openSignInDialog()
    ↓
Dialog opens
    ↓
User enters credentials
    ↓
handleSignIn()
    ↓
authStore.login(credentials)
    ↓
API call to /auth/login
    ↓
[Success]
    ↓
setCustomer() + setAccessToken() + setRefreshToken()
    ↓
saveToLocalStorage()
    ↓
stopListeningForAuth()
    ↓
fetchCart()
    ↓
Dialog closes
```

### External Code Authentication Flow

```
User clicks "Sign In"
    ↓
openSignInDialog()
    ↓
company.login_code.type === 'code'
    ↓
startListeningForAuth()
    ↓
eval(company.login_code.action)
    ↓
[External code executes]
    ↓
localStorage.setItem('jwtToken', ...)
localStorage.setItem('customer', ...)
    ↓
[Listener detects within 500ms]
    ↓
loadFromLocalStorage({ force: true })
    ↓
setCustomer() + setAccessToken()
    ↓
stopListeningForAuth()
    ↓
fetchCart()
```

### External System Integration Flow

```
External system has auth data
    ↓
[Option 1: Use API]
window.customizerApi.auth.setCredentials(...)
    ↓
Writes to localStorage
    ↓
Triggers immediate hydration
    ↓
[Success]

[Option 2: Direct localStorage]
localStorage.setItem('jwtToken', ...)
localStorage.setItem('customer', ...)
    ↓
[Listener detects within 500ms]
    ↓
Automatic hydration
    ↓
[Success]
```

---

## Best Practices

1. **Use the Global API when possible**: It provides immediate feedback and error handling
2. **Always JSON.stringify customer objects**: When setting localStorage directly
3. **Check authentication status**: Before attempting sensitive operations
4. **Handle errors gracefully**: Authentication may fail for various reasons
5. **Clear auth on logout**: Use appropriate logout options based on your use case

---

## Troubleshooting

### Authentication not detected

**Problem**: Set localStorage values but user not authenticated

**Solutions**:

1. Check browser console for `[Auth]` logs
2. Verify customer object is valid JSON
3. Ensure jwtToken is a valid string
4. Check if listener is active: `authStore.startListeningForAuth()`
5. Manually trigger check: `await checkAuthFromStorage()`

### Multiple authentications triggering

**Problem**: Auth detection running multiple times

**Solutions**:

1. Listener automatically stops on success
2. Manually stop: `authStore.stopListeningForAuth()`
3. Check if being called multiple times in code

### Cross-origin issues

**Problem**: Parent window cannot access iframe localStorage

**Solutions**:

1. Ensure same origin policy compliance
2. Use `postMessage` API to communicate
3. Use the global API from within iframe context

---

## Security Considerations

1. **JWT Tokens**: Should have appropriate expiration times
2. **Refresh Tokens**: Automatically encrypted before localStorage storage
3. **HTTPS Only**: All authentication should occur over HTTPS
4. **Token Validation**: Backend should always validate tokens
5. **Logout Cleanup**: Use `clearAllStorage: true` for sensitive applications

---

## Examples

### Parent Window Integration

```javascript
// In parent window
const customizerIframe = document.querySelector('iframe#customizer')

// Wait for customizer to be ready
customizerIframe.addEventListener('load', async () => {
  const customizerWindow = customizerIframe.contentWindow

  // Wait for API to be available
  const checkApi = setInterval(() => {
    if (customizerWindow.customizerApi) {
      clearInterval(checkApi)

      // Authenticate user
      customizerWindow.customizerApi.auth
        .setCredentials({
          jwtToken: parentAuthToken,
          customer: parentCustomerData
        })
        .then(success => {
          console.log('Customizer authenticated:', success)
        })
    }
  }, 100)
})
```

### React Hook Example

```typescript
// useCustomizerAuth.ts
import { useEffect, useState } from 'react'

export function useCustomizerAuth() {
  const [isReady, setIsReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = setInterval(() => {
      if (window.customizerApi) {
        setIsReady(true)
        setIsAuthenticated(window.customizerApi.auth.isAuthenticated())
        clearInterval(checkAuth)
      }
    }, 100)

    return () => clearInterval(checkAuth)
  }, [])

  const authenticateUser = async (token: string, customer: any) => {
    if (!window.customizerApi) return false

    return await window.customizerApi.auth.setCredentials({
      jwtToken: token,
      customer
    })
  }

  return { isReady, isAuthenticated, authenticateUser }
}
```

---

## Version

Last updated: 2026-01-15
API Version: 1.0.0
