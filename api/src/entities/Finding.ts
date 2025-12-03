/**
 * Finding entity representing security vulnerabilities discovered
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm'
import { User } from './User'
import { Program } from './Program'
import { Report } from './Report'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'informational'
export type FindingStatus = 'submitted' | 'triaged' | 'resolved' | 'duplicate' | 'not_applicable' | 'spam'
export type FindingType = 'xss' | 'sql_injection' | 'authentication_bypass' | 'authorization_bypass' | 'information_disclosure' | 'business_logic' | 'other'

@Entity('findings')
@Index(['severity', 'status'])
@Index(['researcher_id', 'created_at'])
@Index(['program_id', 'status'])
export class Finding {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  title: string

  @Column({ type: 'text' })
  description: string

  @Column({ type: 'text', nullable: true })
  technical_details: string

  @Column({ type: 'text', nullable: true })
  reproduction_steps: string

  @Column({ type: 'text', nullable: true })
  impact: string

  @Column({ type: 'text', nullable: true })
  remediation: string

  @Column({ type: 'enum', enum: ['critical', 'high', 'medium', 'low', 'informational'] })
  severity: Severity

  @Column({ type: 'enum', enum: ['xss', 'sql_injection', 'authentication_bypass', 'authorization_bypass', 'information_disclosure', 'business_logic', 'other'] })
  type: FindingType

  @Column({ type: 'enum', enum: ['submitted', 'triaged', 'resolved', 'duplicate', 'not_applicable', 'spam'], default: 'submitted' })
  status: FindingStatus

  @Column({ type: 'jsonb', nullable: true })
  affected_endpoints: string[]

  @Column({ type: 'jsonb', nullable: true })
  screenshots: {
    url: string
    description: string
  }[]

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimated_reward: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actual_reward: number

  @Column({ type: 'timestamp', nullable: true })
  submitted_at: Date

  @Column({ type: 'timestamp', nullable: true })
  triaged_at: Date

  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @ManyToOne(() => User, user => user.findings)
  researcher: User

  @ManyToOne(() => Program, program => program.findings)
  program: Program

  @ManyToOne(() => Report, report => report.findings)
  report: Report

  // Get CVSS score based on severity
  getCvssScore(): number {
    const scores = {
      critical: 9.0,
      high: 7.0,
      medium: 4.0,
      low: 2.0,
      informational: 0.0
    }
    return scores[this.severity] || 0.0
  }

  // Check if finding is active (not resolved or duplicate)
  isActive(): boolean {
    return !['resolved', 'duplicate', 'not_applicable', 'spam'].includes(this.status)
  }

  // Get reward status
  getRewardStatus(): 'pending' | 'approved' | 'paid' | 'none' {
    if (this.actual_reward) return 'paid'
    if (this.estimated_reward && this.status === 'resolved') return 'approved'
    if (this.estimated_reward) return 'pending'
    return 'none'
  }
}
