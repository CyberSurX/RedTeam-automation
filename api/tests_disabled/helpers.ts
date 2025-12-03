import { query as pool } from '../src/config/database'
import bcrypt from 'bcrypt'

export async function createTestUser() {
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10)
  const result = await pool.query(
    'INSERT INTO users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    ['testuser', 'test@example.com', hashedPassword, 'user', true]
  )
  return result.rows[0]
}

export async function getAuthToken(email: string, password: string) {
  // This would normally make an API call, but for testing we'll create a JWT directly
  const jwt = require('jsonwebtoken')
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  const user = result.rows[0]

  if (!user) throw new Error('User not found')

  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) throw new Error('Invalid password')

  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '24h' }
  )
}

export async function createTestProgram() {
  const result = await pool.query(
    'INSERT INTO programs (name, platform, url, scope, rewards, status, automation_enabled) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    ['Test Program', 'hackerone', 'https://hackerone.com/test', '*.test.com, test.com', JSON.stringify({ min: 100, max: 5000 }), 'active', true]
  )
  return result.rows[0]
}

export async function createTestFinding(programId: number) {
  const result = await pool.query(
    `INSERT INTO findings (program_id, title, description, severity, status, type, target, evidence, remediation) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      programId,
      'Test Finding',
      'This is a test finding for unit testing',
      'high',
      'new',
      'xss',
      'https://test.example.com',
      JSON.stringify({ url: 'https://test.example.com/vulnerable', payload: '<script>alert(1)</script>' }),
      'Sanitize user input and encode output'
    ]
  )
  return result.rows[0]
}

export async function createTestReconJob(programId: number) {
  const result = await pool.query(
    'INSERT INTO recon_jobs (program_id, target_domain, tools, status, progress) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [programId, 'test.example.com', JSON.stringify(['amass', 'subfinder']), 'running', 50]
  )
  return result.rows[0]
}

export async function createTestScanJob(programId: number) {
  const result = await pool.query(
    'INSERT INTO scan_jobs (program_id, target_hosts, scan_type, tools, status, progress) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [programId, JSON.stringify(['test.example.com']), 'web', JSON.stringify(['nmap', 'nuclei']), 'running', 75]
  )
  return result.rows[0]
}

export async function createTestExploitationJob(programId: number) {
  const result = await pool.query(
    'INSERT INTO exploitation_jobs (program_id, target_url, vulnerability_type, safety_level, tools, status, progress) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [programId, 'https://test.example.com', 'xss', 'safe', JSON.stringify(['dalfox']), 'running', 25]
  )
  return result.rows[0]
}

export async function createTestReport(programId: number, userId: number) {
  const result = await pool.query(
    'INSERT INTO reports (program_id, title, template, platform, status, severity, findings, submitted_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [programId, 'Test Report', 'hackerone', 'hackerone', 'draft', 'high', JSON.stringify([]), userId]
  )
  return result.rows[0]
}

export async function cleanupTestData() {
  await pool.query('DELETE FROM triage_history')
  await pool.query('DELETE FROM findings')
  await pool.query('DELETE FROM exploitation_jobs')
  await pool.query('DELETE FROM scan_jobs')
  await pool.query('DELETE FROM recon_jobs')
  await pool.query('DELETE FROM reports')
  await pool.query('DELETE FROM programs')
  await pool.query('DELETE FROM users WHERE email != $1', ['admin@example.com'])
}