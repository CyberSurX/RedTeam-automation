# React Contexts

Global state management using React Context API for authentication and application-wide state.

## 📁 Structure

```
contexts/
├── AuthContext.tsx      # Authentication state and user data
└── (additional contexts as needed)
```

---

## 🔐 AuthContext (AuthContext.tsx)

### Purpose
Provides authentication state and user data throughout the application.

### State

| State | Type | Description |
|-------|------|-------------|
| user | User \| null | Current authenticated user |
| isAuthenticated | boolean | Whether user is logged in |
| isLoading | boolean | Loading state for auth operations |
| error | string \| null | Authentication error message |

### Methods

| Method | Description |
|--------|-------------|
| `login(email, password)` | Log in with email/password |
| `register(email, password, name)` | Register new user |
| `logout()` | Log out current user |
| `updateProfile(data)` | Update user profile |

### Usage

```typescript
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <h1>Welcome, {user?.username}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Auth Provider

Wrap your application with `AuthProvider`:

```typescript
// src/main.tsx or src/App.tsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
```

---

## 🔑 JWT Token Management

The AuthContext automatically manages JWT tokens:

- Stores token in `localStorage` as `auth_token`
- Includes token in API request headers
- Validates token on app load
- Auto-redirects to login if token is invalid

### Token Structure

```typescript
interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  iat: number;  // Issued at
  exp: number;  // Expiration
}
```

---

## 🛡️ Role-Based Access Control

Use the `role` from user object for RBAC:

```typescript
function AdminPanel() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <AccessDenied />;
  }

  return <AdminDashboard />;
}
```

### Roles

| Role | Permissions |
|------|-------------|
| admin | Full access to all resources |
| user | Access to own resources |
| viewer | Read-only access |

---

## 🔄 Authentication Flow

```
1. User enters credentials
2. POST /api/auth/login
3. Server validates credentials
4. Server returns JWT token
5. Client stores token in localStorage
6. Client includes token in request headers
7. Server validates token on protected routes
```

---

## 🧪 Testing

```typescript
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const TestComponent = () => {
  const { isAuthenticated } = useAuth();
  return <div>{isAuthenticated ? 'Logged in' : 'Not logged in'}</div>;
};

test('shows logged out state', () => {
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
  expect(screen.getByText('Not logged in')).toBeInTheDocument();
});
```

---

## 🔐 Security Considerations

1. **Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
2. **Token Expiration**: Tokens expire after 7 days (configurable)
3. **HTTPS Required**: Always use HTTPS in production to prevent token interception
4. **CSRF Protection**: Implement CSRF tokens if using cookie-based auth

---

## 🚀 Adding New Contexts

Create a new context for global state management:

```typescript
// src/contexts/MyContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface MyContextValue {
  value: string;
  setValue: (val: string) => void;
}

const MyContext = createContext<MyContextValue | undefined>(undefined);

export const MyProvider = ({ children }: { children: ReactNode }) => {
  const [value, setValue] = useState('');

  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  );
};

export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) throw new Error('useMyContext must be used within MyProvider');
  return context;
};
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "axios": "^1.6.0"
  }
}
```