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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Since we're simplifying without related counts for now
    const programsWithCounts = programs.map(program => ({
      ...program,
      scope_count: 0,
      job_count: 0,
      findings_count: 0
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

    // Add dummy counts for now
    const programWithCounts = {
      ...program,
      scope_count: 0,
      job_count: 0,
      findings_count: 0
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
      res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
      return;
    }

    const { name, scopeRules } = req.body;

    // Map the request body to Prisma schema
    const program = await prisma.program.create({
      data: {
        name: name,
        description: scopeRules?.description || '', // Provide default description
        scope: scopeRules?.scope || '', // Provide default scope
        rewards: scopeRules?.rewards || null,
        rules: scopeRules?.rules || null,
        createdBy: req.user.id
      }
    });

    res.status(201).json({
      message: 'Program created successfully',
      program: program
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
    const { name, scopeRules, isActive } = req.body;

    // Map status if isActive is provided
    const status = isActive !== undefined 
      ? (isActive ? 'ACTIVE' : 'DRAFT')
      : undefined;

    // Check if program exists and belongs to user
    const existingProgram = await prisma.program.findUnique({
      where: {
        id: id,
        createdBy: req.user.id
      }
    });

    if (!existingProgram) {
      res.status(404).json({ 
        error: 'Program not found',
        code: 'PROGRAM_NOT_FOUND'
      });
      return;
    }

    const updatedProgram = await prisma.program.update({
      where: {
        id: id,
        createdBy: req.user.id
      },
      data: {
        name: name,
        description: scopeRules?.description || existingProgram.description,
        scope: scopeRules?.scope || existingProgram.scope,
        rewards: scopeRules?.rewards || existingProgram.rewards,
        rules: scopeRules?.rules || existingProgram.rules,
        ...(status && { status: status })
      }
    });

    res.json({
      message: 'Program updated successfully',
      program: updatedProgram
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
    const existingProgram = await prisma.program.findUnique({
      where: {
        id: id,
        createdBy: req.user.id
      }
    });

    if (!existingProgram) {
      res.status(404).json({ 
        error: 'Program not found',
        code: 'PROGRAM_NOT_FOUND'
      });
      return;
    }

    await prisma.program.delete({
      where: {
        id: id,
        createdBy: req.user.id
      }
    });

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

    const program = await prisma.program.findUnique({
      where: {
        id: id,
        createdBy: req.user.id
      }
    });

    if (!program) {
      res.status(404).json({ 
        error: 'Program not found',
        code: 'PROGRAM_NOT_FOUND'
      });
      return;
    }

    // Return basic stats for now (simplified without related entities)
    const stats = {
      id: program.id,
      name: program.name,
      platform: 'custom', // Default platform
      scope_count: 0,
      total_jobs: 0,
      completed_jobs: 0,
      failed_jobs: 0,
      running_jobs: 0,
      total_findings: 0,
      critical_findings: 0,
      high_findings: 0,
      medium_findings: 0,
      low_findings: 0,
      reports_submitted: 0,
      total_bounty: 0
    };

    res.json({
      stats: stats
    });
  } catch (error) {
    console.error('Get program stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get program statistics',
      code: 'INTERNAL_ERROR'
    });
  }
}
