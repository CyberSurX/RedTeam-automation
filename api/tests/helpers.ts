typescript
import { query as pool } from '../src/config/database'
import bcrypt from 'bcrypt'

export async function createTestUser() {
  const username = `testuser_${Date.now()}`;
  const email = `${username}@test`;
  const password = `TestPassword${Math.random().toString(36).substring(2, 6)}`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [username, email, hashedPassword, 'user', true]
  );
  return result.rows[0];
}

export async function getAuthToken(email: string, password: string) {
  const jwt = require('jsonwebtoken');
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) throw new Error('User not found');

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('Invalid password');

  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '24h' }
  );
}

export async function createTestProgram() {
  const name = `Program_${Date.now()}`;
  const platform = 'hackerone';
  const domain = `${name.toLowerCase().replace(' ', '-')}.test`;
  const url = `https://${domain}`;
  const scope = `*.${domain}, ${domain}`;
  const rewards = JSON.stringify({ min: Math.floor(Math.random() * 1000), max: Math.floor(Math.random() * 10000) });
  const status = 'active';
  const automation_enabled = true;
  const result = await pool.query(
    'INSERT INTO programs (name, platform, url, scope, rewards, status, automation_enabled) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [name, platform, url, scope, rewards, status, automation_enabled]
  );
  return result.rows[0];
}

export async function createTestFinding(programId: number) {
  const title = `Finding_${Date.now()}`;
  const description = `This is a finding for ${title}`;
  const severity = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)];
  const status = ['new', 'in progress', 'resolved'][Math.floor(Math.random() * 3)];
  const type = ['xss', 'sql-injection', 'csrf', 'idor'][Math.floor(Math.random() * 4)];
  const domain = `${title.toLowerCase().replace(' ', '-')}.test`;
  const target = `https://${domain}/vulnerable`;
  const payload = `<script>alert('${Math.random()}')</script>`;
  const evidence = JSON.stringify({ url: target, payload });
  const remediation = `Sanitize user input and encode output for ${type}`;
  const result = await pool.query(
    `INSERT INTO findings (program_id, title, description, severity, status, type, target, evidence, remediation) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      programId,
      title,
      description,
      severity,
      status,
      type,
      target,
      evidence,
      remediation
    ]
  );
  return result.rows[0];
}

export async function createTestReconJob(programId: number) {
  const domain = `recon-${Math.random().toString(36).substring(2, 6)}.test`;
  const tools = JSON.stringify(['amass', 'subfinder']);
  const status = ['running', 'completed', 'failed'][Math.floor(Math.random() * 3)];
  const progress = Math.floor(Math.random() * 100);
  const result = await pool.query(
    'INSERT INTO recon_jobs (program_id, target_domain, tools, status, progress) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [programId, domain, tools, status, progress]
  );
  return result.rows[0];
}

export async function createTestScanJob(programId: number) {
  const domain = `scan-${Math.random().toString(36).substring(2, 6)}.test`;
  const targetHosts = JSON.stringify([domain]);
  const scanType = ['web', 'network', 'mobile'][Math.floor(Math.random() * 3)];
  const tools = JSON.stringify(['nmap', 'nuclei']);
  const status = ['running', 'completed', 'failed'][Math.floor(Math.random() * 3)];
  const progress = Math.floor(Math.random() * 100);
  const result = await pool.query(
    'INSERT INTO scan_jobs (program_id, target_hosts, scan_type, tools, status, progress) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [programId, targetHosts, scanType, tools, status, progress]
  );
  return result.rows[0];
}

export async function createTestExploitationJob(programId: number) {
  const domain = `exploit-${Math.random().toString(36).substring(2, 6)}.test`;
  const targetUrl = `https://${domain}/vulnerable`;
  const vulnerabilityType = ['xss', 'sql-injection', 'rce'][Math.floor(Math.random() * 3)];
  const status = ['running', 'completed', 'failed'][Math.floor(Math.random() * 3)];
  const progress = Math.floor(Math.random() * 100);
  const result = await pool.query(
    'INSERT INTO exploitation_jobs (program_id, target_url, vulnerability_type, status, progress) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [programId, targetUrl, vulnerabilityType, status, progress]
  );
  return result.rows[0];
}