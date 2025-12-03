import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { app } from '../src/app'
import { query as pool } from '../src/config/database'
import { createTestUser, getAuthToken, createTestProgram } from './helpers'

describe('Programs API', () => {
  let testUser: any
  let authToken: string
  let testProgram: any

  beforeAll(async () => {
    testUser = await createTestUser()
    authToken = await getAuthToken(testUser.email, 'TestPassword123!')
    testProgram = await createTestProgram()
  })

  afterAll(async () => {
    await pool.query('DELETE FROM programs WHERE id = $1', [testProgram.id])
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id])
    await pool.end()
  })

  describe('GET /api/programs', () => {
    it('should get all programs', async () => {
      const response = await app.request('/api/programs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.programs)).toBe(true)
    })

    it('should reject request without token', async () => {
      const response = await app.request('/api/programs', {
        method: 'GET'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/programs', () => {
    it('should create a new program', async () => {
      const newProgram = {
        name: 'Test Program',
        platform: 'hackerone',
        url: 'https://hackerone.com/test',
        scope: '*.test.com, test.com',
        rewards: { min: 100, max: 5000 },
        automation_enabled: true
      }

      const response = await app.request('/api/programs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProgram)
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('program')
      expect(data.program.name).toBe(newProgram.name)
      expect(data.program.platform).toBe(newProgram.platform)
    })

    it('should reject invalid program data', async () => {
      const invalidProgram = {
        name: '',
        platform: 'invalid-platform'
      }

      const response = await app.request('/api/programs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidProgram)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })

  describe('GET /api/programs/:id', () => {
    it('should get program by id', async () => {
      const response = await app.request(`/api/programs/${testProgram.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('program')
      expect(data.program.id).toBe(testProgram.id)
    })

    it('should return 404 for non-existent program', async () => {
      const response = await app.request('/api/programs/99999', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })

  describe('PUT /api/programs/:id', () => {
    it('should update program', async () => {
      const updateData = {
        name: 'Updated Program Name',
        status: 'paused'
      }

      const response = await app.request(`/api/programs/${testProgram.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('program')
      expect(data.program.name).toBe(updateData.name)
      expect(data.program.status).toBe(updateData.status)
    })
  })

  describe('DELETE /api/programs/:id', () => {
    it('should delete program', async () => {
      const tempProgram = await createTestProgram()

      const response = await app.request(`/api/programs/${tempProgram.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(204)
    })

    it('should return 404 for non-existent program', async () => {
      const response = await app.request('/api/programs/99999', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(404)
    })
  })
})