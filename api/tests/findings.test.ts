import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { app } from '../src/app'
import { query as pool } from '../src/config/database'
import { createTestUser, getAuthToken, createTestProgram, createTestFinding } from './helpers'

describe('Findings API', () => {
  let testUser: any
  let authToken: string
  let testProgram: any
  let testFinding: any

  beforeAll(async () => {
    testUser = await createTestUser()
    authToken = await getAuthToken(testUser.email, 'TestPassword123!')
    testProgram = await createTestProgram()
    testFinding = await createTestFinding(testProgram.id)
  })

  afterAll(async () => {
    await pool.query('DELETE FROM findings WHERE id = $1', [testFinding.id])
    await pool.query('DELETE FROM programs WHERE id = $1', [testProgram.id])
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id])
    await pool.end()
  })

  describe('GET /api/findings', () => {
    it('should get all findings', async () => {
      const response = await app.request('/api/findings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.findings)).toBe(true)
    })

    it('should filter findings by severity', async () => {
      const response = await app.request('/api/findings?severity=high', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.findings)).toBe(true)
    })

    it('should filter findings by status', async () => {
      const response = await app.request('/api/findings?status=new', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.findings)).toBe(true)
    })

    it('should search findings by title', async () => {
      const response = await app.request(`/api/findings?search=${encodeURIComponent(testFinding.title)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.findings)).toBe(true)
    })
  })

  describe('GET /api/findings/:id', () => {
    it('should get finding by id', async () => {
      const response = await app.request(`/api/findings/${testFinding.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('finding')
      expect(data.finding.id).toBe(testFinding.id)
    })

    it('should return 404 for non-existent finding', async () => {
      const response = await app.request('/api/findings/99999', {
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

  describe('PUT /api/findings/:id/triage', () => {
    it('should triage finding', async () => {
      const triageData = {
        status: 'confirmed',
        reason: 'Valid vulnerability found'
      }

      const response = await app.request(`/api/findings/${testFinding.id}/triage`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(triageData)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('finding')
      expect(data.finding.status).toBe(triageData.status)
    })

    it('should mark finding as false positive', async () => {
      const triageData = {
        status: 'false_positive',
        reason: 'Not a valid vulnerability'
      }

      const response = await app.request(`/api/findings/${testFinding.id}/triage`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(triageData)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('finding')
      expect(data.finding.status).toBe(triageData.status)
      expect(data.finding.false_positive).toBe(true)
    })
  })

  describe('POST /api/findings/bulk-triage', () => {
    it('should bulk triage findings', async () => {
      const tempFinding1 = await createTestFinding(testProgram.id)
      const tempFinding2 = await createTestFinding(testProgram.id)

      const bulkTriageData = {
        findingIds: [tempFinding1.id, tempFinding2.id],
        status: 'triaged',
        reason: 'Bulk triage operation'
      }

      const response = await app.request('/api/findings/bulk-triage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bulkTriageData)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('updated')
      expect(data.updated).toBe(2)

      // Cleanup
      await pool.query('DELETE FROM findings WHERE id IN ($1, $2)', [tempFinding1.id, tempFinding2.id])
    })
  })

  describe('GET /api/findings/stats', () => {
    it('should get findings statistics', async () => {
      const response = await app.request('/api/findings/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('stats')
      expect(data.stats).toHaveProperty('total')
      expect(data.stats).toHaveProperty('bySeverity')
      expect(data.stats).toHaveProperty('byStatus')
    })
  })
})