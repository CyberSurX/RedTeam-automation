/**
 * Report entity representing security assessment reports
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm'
import { User } from './User'
import { Finding } from './Finding'

export type ReportStatus = 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected'
export type ReportType = 'vulnerability_assessment' | 'penetration_test' | 'security_audit' | 'compliance_check'

@Entity('reports')
@Index(['status', 'created_at'])
@Index(['created_by_id', 'created_at'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  title!: string

  @Column({ type: 'text' })
  summary!: string

  @Column({ type: 'text', nullable: true })
  executive_summary!: string

  @Column({ type: 'text', nullable: true })
  methodology!: string

  @Column({ type: 'text', nullable: true })
  scope!: string

  @Column({ type: 'enum', enum: ['draft', 'submitted', 'reviewed', 'approved', 'rejected'], default: 'draft' })
  status!: ReportStatus

  @Column({ type: 'enum', enum: ['vulnerability_assessment', 'penetration_test', 'security_audit', 'compliance_check'] })
  type!: ReportType

  @Column({ type: 'jsonb', nullable: true })
  target_info!: {
    name: string
    url: string
    ip_range: string[]
    description: string
  }

  @Column({ type: 'jsonb', nullable: true })
  risk_assessment!: {
    overall_risk: 'critical' | 'high' | 'medium' | 'low'
    critical_count: number
    high_count: number
    medium_count: number
    low_count: number
    informational_count: number
  }

  @Column({ type: 'jsonb', nullable: true })
  recommendations!: {
    immediate: string[]
    short_term: string[]
    long_term: string[]
  }

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown>

  @Column({ type: 'timestamp', nullable: true })
  submitted_at!: Date

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at!: Date

  @Column({ type: 'timestamp', nullable: true })
  approved_at!: Date

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date

  @ManyToOne(() => User, user => user.reports)
  created_by!: User

  @OneToMany(() => Finding, finding => finding.report)
  findings!: Finding[]

  // Get total findings count
  getTotalFindings(): number {
    return this.findings?.length || 0
  }

  // Get findings by severity
  getFindingsBySeverity(severity: 'critical' | 'high' | 'medium' | 'low' | 'informational'): number {
    return this.findings?.filter(f => f.severity === severity).length || 0
  }

  // Check if report can be edited
  canEdit(): boolean {
    return this.status === 'draft'
  }

  // Submit report for review
  submit(): void {
    if (this.status === 'draft') {
      this.status = 'submitted'
      this.submitted_at = new Date()
    }
  }
}
