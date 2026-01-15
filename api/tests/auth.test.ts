typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { app } from '../src/app'
import { query as pool } from '../src/config/database'
import bcrypt from 'bcrypt'

describe('Authentication API', () => {
  let testUser: any
  let authToken: string

  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['test@redteam-automation.test'])
  })

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['test@redteam-automation.test'])
    await pool.end()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@redteam-automation.test',
          password: 'TestPassword123!'
        })
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('user')
      expect(data.user.email).toBe('test@redteam-automation.test')
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
          email: 'test@redteam-automation.test',
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
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10)
      const result = await pool.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
        ['testuser', 'test@redteam-automation.test', hashedPassword]
      )
      testUser = result.rows[0]
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
          email: 'invalid@redteam-automation.test',
          password: 'wrongpassword'
        })
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })
})