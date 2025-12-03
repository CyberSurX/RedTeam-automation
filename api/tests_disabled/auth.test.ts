import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { app } from '../src/app'
import { query as pool } from '../src/config/database'
import { createTestUser, getAuthToken } from './helpers'

describe('Authentication API', () => {
  let testUser: any
  let authToken: string

  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com'])
  })

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com'])
    await pool.end()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('user')
      expect(data.user.email).toBe('test@example.com')
      expect(data).toHaveProperty('token')
    })

    it('should reject registration with invalid email', async () => {
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          email: 'invalid-email',
          password: 'TestPassword123!'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should reject registration with weak password', async () => {
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'weak'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      testUser = await createTestUser()
    })

    it('should login with valid credentials', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'TestPassword123!'
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('token')
      authToken = data.token
    })

    it('should reject login with invalid credentials', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'WrongPassword'
        })
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await app.request('/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('user')
      expect(data.user.email).toBe(testUser.email)
    })

    it('should reject request without token', async () => {
      const response = await app.request('/api/auth/profile', {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })

    it('should reject request with invalid token', async () => {
      const response = await app.request('/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await app.request('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('message')
    })
  })
})