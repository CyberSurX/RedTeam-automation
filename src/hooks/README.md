# Custom React Hooks

Reusable React hooks for common functionality across the application.

## 📁 Structure

```
hooks/
├── useTheme.ts            # Theme management (dark/light mode)
└── (additional hooks as needed)
```

---

## 🎨 useTheme (useTheme.ts)

### Purpose
Manage application theme (light/dark mode) with persistence.

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| theme | 'light' \| 'dark' | Current theme |
| toggleTheme | () => void | Toggle between themes |
| setTheme | (theme: 'light' \| 'dark') => void | Set specific theme |

### Usage

```typescript
import { useTheme } from '../hooks/useTheme';

function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header>
      <button onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  );
}
```

### Theme Provider

Wrap your application with theme provider:

```typescript
// src/main.tsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}
```

### Tailwind Integration

The theme is applied to the `<html>` element:

```html
<html class="dark">  <!-- Dark mode -->
<html class="light"> <!-- Light mode (default) -->
```

Use Tailwind's dark mode modifiers:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content changes based on theme
</div>
```

---

## 🔄 Creating Custom Hooks

### Basic Hook Template

```typescript
import { useState, useEffect } from 'react';

export function useMyHook(initialValue: any) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, [/* dependencies */]);

  return { state, setState };
}
```

---

## 🧪 Common Hook Patterns

### useLocalStorage

Persist state to localStorage:

```typescript
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

// Usage
const [name, setName] = useLocalStorage('name', '');
```

### useDebounce

Debounce a value:

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const debouncedSearchTerm = useDebounce(searchTerm, 500);
```

### useFetch

Data fetching hook:

```typescript
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// Usage
const { data, loading, error } = useFetch('/api/programs');
```

### useToggle

Toggle boolean state:

```typescript
function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);

  return [value, toggle, setValue] as const;
}

// Usage
const [isOpen, toggleOpen, setIsOpen] = useToggle();
```

---

## 📚 Hooks Best Practices

1. **Prefix with 'use'**: Always start hook names with 'use'
2. **Return stable references**: Use `useCallback` and `useMemo`
3. **Handle cleanup**: Return cleanup function in `useEffect`
4. **Use TypeScript**: Type all parameters and return values
5. **Keep focused**: Each hook should do one thing well

---

## 🔧 Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

test('should toggle theme', () => {
  const { result } = renderHook(() => useTheme());

  expect(result.current.theme).toBe('light');

  act(() => {
    result.current.toggleTheme();
  });

  expect(result.current.theme).toBe('dark');
});
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

---

## 🚀 Adding New Hooks

1. Create hook file in `src/hooks/`
2. Export hook function
3. Add JSDoc documentation
4. Write tests in `src/hooks/__tests__/`
5. Export from `src/hooks/index.ts`

```typescript
// src/hooks/useMyCustomHook.ts
/**
 * Custom hook for XYZ functionality
 * @param param - Description
 * @returns Description of return value
 */
export function useMyCustomHook(param: string) {
  const [value, setValue] = useState('');

  useEffect(() => {
    // Hook logic
  }, [param]);

  return { value, setValue };
}

// src/hooks/index.ts
export * from './useTheme';
export * from './useMyCustomHook';
```