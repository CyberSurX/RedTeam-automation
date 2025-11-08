import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { BrowserRouter } from 'react-router-dom'

// Mock fetch
global.fetch = vi.fn()

const mockFetch = fetch as ReturnType<typeof vi.fn>

const TestComponent = () => {
  const { user, login, logout, isLoading, error } = useAuth()
  
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'not-logged-in'}</div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should initialize with no user', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('not-logged-in')
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    expect(screen.getByTestId('error')).toHaveTextContent('no-error')
  })

  it('should handle successful login', async () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' }
    const token = 'mock-jwt-token'
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user, token }),
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    )

    const loginButton = screen.getByText('Login')
    await userEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      expect(localStorage.getItem('token')).toBe(token)
    })
  })

  it('should handle login failure', async () => {
    const errorMessage = 'Invalid credentials'
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    )

    const loginButton = screen.getByText('Login')
    await userEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
      expect(screen.getByTestId('user')).toHaveTextContent('not-logged-in')
    })
  })

  it('should handle logout', async () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' }
    const token = 'mock-jwt-token'
    
    // Mock login first
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user, token }),
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    )

    const loginButton = screen.getByText('Login')
    await userEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })

    // Now test logout
    const logoutButton = screen.getByText('Logout')
    await userEvent.click(logoutButton)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('not-logged-in')
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  it('should show loading state during login', async () => {
    mockFetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ user: {}, token: 'token' }),
        }), 100)
      )
    )

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    )

    const loginButton = screen.getByText('Login')
    await userEvent.click(loginButton)

    expect(screen.getByTestId('loading')).toHaveTextContent('loading')

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
  })
})