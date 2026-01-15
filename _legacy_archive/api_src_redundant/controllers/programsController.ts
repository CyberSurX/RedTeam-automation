typescript
import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

export const programValidation = [
  body('name').isLength({ min: 1, max: 200 }).trim(),
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

    const programs = await prisma.program.findMany({
      where: {
        createdBy: req.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            jobs: true,
            findings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const programsWithCounts = programs.map(program => ({
      ...program,
      scope_count: Array.isArray(program.scopeRules) ? program.scopeRules.length : 0,
      job_count: program._count.jobs,
      findings_count: program._count.findings
    }));

    res.json({
      programs: programsWithCounts,
      total: programs.length
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

    const program = await prisma.program.findUnique({
      where: {
        id: id,
        createdBy: req.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            jobs: true,
            findings: true
          }
        }
      }
    });

    if (!program) {
      res.status(404).json({ 
        error: 'Program not found',
        code: 'PROGRAM_NOT_FOUND'
      });
      return;
    }

    const programWithCounts = {
      ...program,
      scope_count: Array.isArray(program.scopeRules) ? program.scopeRules.length : 0,
      job_count: program._count.jobs,
      findings_count: program._count.findings
    };

    res.json({
      program: programWithCounts
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
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const program = await prisma.program.create({
      data: {
        name: req.body.name,
        scopeRules: req.body.scopeRules,
        createdBy: req.user.id
      }
    });

    const scope_count = Array.isArray(program.scopeRules) ? program.scopeRules.length : 0;
    const programWithCounts = {
      ...program,
      scope_count,
      job_count: 0,
      findings_count: 0
    };

    res.status(201).json({
      program: programWithCounts
    });
  } catch (error) {
    console.error('Create program error:', error);
    res.status(500).json({ 
      error: 'Failed to create program',
      code: 'INTERNAL_ERROR'
    });
  }
}