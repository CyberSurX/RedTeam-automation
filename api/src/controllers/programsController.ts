import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

export const programValidation = [
  body('name').isLength({ min: 1, max: 200 }).trim(),
  body('platform').isIn(['hackerone', 'bugcrowd', 'yeswehack', 'intigriti', 'custom']),
  body('programUrl').optional().isURL(),
  body('scopeRules').optional().isObject()
];

// Get all programs for the authenticated user
export async function getPrograms(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const result = await query(
      `SELECT p.*, 
              COUNT(DISTINCT s.id) as scope_count,
              COUNT(DISTINCT j.id) as job_count,
              COUNT(DISTINCT f.id) as findings_count
       FROM programs p
       LEFT JOIN scopes s ON p.id = s.program_id
       LEFT JOIN jobs j ON p.id = j.program_id
       LEFT JOIN findings f ON p.id = f.program_id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.user.userId]
    );

    res.json({
      programs: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({ 
      error: 'Failed to get programs',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Get a specific program by ID
export async function getProgram(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const { id } = req.params;

    const result = await query(
      `SELECT p.*, 
              COUNT(DISTINCT s.id) as scope_count,
              COUNT(DISTINCT j.id) as job_count,
              COUNT(DISTINCT f.id) as findings_count
       FROM programs p
       LEFT JOIN scopes s ON p.id = s.program_id
       LEFT JOIN jobs j ON p.id = j.program_id
       LEFT JOIN findings f ON p.id = f.program_id
       WHERE p.id = $1 AND p.user_id = $2
       GROUP BY p.id`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ 
        error: 'Program not found',
        code: 'PROGRAM_NOT_FOUND'
      });
      return;
    }

    res.json({
      program: result.rows[0]
    });
  } catch (error) {
    console.error('Get program error:', error);
    res.status(500).json({ 
      error: 'Failed to get program',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Create a new program
export async function createProgram(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
      return;
    }

    const { name, platform, programUrl, scopeRules } = req.body;

    const result = await query(
      `INSERT INTO programs (user_id, name, platform, program_url, scope_rules) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [req.user.userId, name, platform, programUrl, JSON.stringify(scopeRules)]
    );

    res.status(201).json({
      message: 'Program created successfully',
      program: result.rows[0]
    });
  } catch (error) {
    console.error('Create program error:', error);
    res.status(500).json({ 
      error: 'Failed to create program',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Update a program
export async function updateProgram(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
      return;
    }

    const { id } = req.params;
    const { name, platform, programUrl, scopeRules, isActive } = req.body;

    // Check if program exists and belongs to user
    const existingProgram = await query(
      'SELECT id FROM programs WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (existingProgram.rows.length === 0) {
      res.status(404).json({ 
        error: 'Program not found',
        code: 'PROGRAM_NOT_FOUND'
      });
      return;
    }

    const result = await query(
      `UPDATE programs 
       SET name = $1, platform = $2, program_url = $3, scope_rules = $4, is_active = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name, platform, programUrl, JSON.stringify(scopeRules), isActive, id, req.user.userId]
    );

    res.json({
      message: 'Program updated successfully',
      program: result.rows[0]
    });
  } catch (error) {
    console.error('Update program error:', error);
    res.status(500).json({ 
      error: 'Failed to update program',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Delete a program
export async function deleteProgram(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const { id } = req.params;

    // Check if program exists and belongs to user
    const existingProgram = await query(
      'SELECT id FROM programs WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (existingProgram.rows.length === 0) {
      res.status(404).json({ 
        error: 'Program not found',
        code: 'PROGRAM_NOT_FOUND'
      });
      return;
    }

    await query('DELETE FROM programs WHERE id = $1 AND user_id = $2', [id, req.user.userId]);

    res.json({
      message: 'Program deleted successfully'
    });
  } catch (error) {
    console.error('Delete program error:', error);
    res.status(500).json({ 
      error: 'Failed to delete program',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Get program statistics
export async function getProgramStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const { id } = req.params;

    const result = await query(
      `SELECT 
         p.id, p.name, p.platform,
         COUNT(DISTINCT s.id) as scope_count,
         COUNT(DISTINCT j.id) as total_jobs,
         COUNT(DISTINCT CASE WHEN j.status = 'completed' THEN j.id END) as completed_jobs,
         COUNT(DISTINCT CASE WHEN j.status = 'failed' THEN j.id END) as failed_jobs,
         COUNT(DISTINCT CASE WHEN j.status = 'running' THEN j.id END) as running_jobs,
         COUNT(DISTINCT f.id) as total_findings,
         COUNT(DISTINCT CASE WHEN f.severity = 'critical' THEN f.id END) as critical_findings,
         COUNT(DISTINCT CASE WHEN f.severity = 'high' THEN f.id END) as high_findings,
         COUNT(DISTINCT CASE WHEN f.severity = 'medium' THEN f.id END) as medium_findings,
         COUNT(DISTINCT CASE WHEN f.severity = 'low' THEN f.id END) as low_findings,
         COUNT(DISTINCT r.id) as reports_submitted,
         COALESCE(SUM(r.bounty_amount), 0) as total_bounty
       FROM programs p
       LEFT JOIN scopes s ON p.id = s.program_id
       LEFT JOIN jobs j ON p.id = j.program_id
       LEFT JOIN findings f ON p.id = f.program_id
       LEFT JOIN reports r ON f.id = r.finding_id
       WHERE p.id = $1 AND p.user_id = $2
       GROUP BY p.id, p.name, p.platform`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ 
        error: 'Program not found',
        code: 'PROGRAM_NOT_FOUND'
      });
      return;
    }

    res.json({
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Get program stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get program statistics',
      code: 'INTERNAL_ERROR'
    });
  }
}