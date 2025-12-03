/**
 * Program entity representing bug bounty programs
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm'
import { User } from './User'
import { Finding } from './Finding'

export type ProgramStatus = 'active' | 'paused' | 'completed' | 'draft'
export type ProgramType = 'public' | 'private' | 'invite_only'

@Entity('programs')
@Index(['status', 'created_at'])
@Index(['platform', 'program_id'])
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column()
  platform: string // 'hackerone', 'bugcrowd', etc.

  @Column()
  program_id: string // External platform ID

  @Column({ type: 'enum', enum: ['active', 'paused', 'completed', 'draft'], default: 'active' })
  status: ProgramStatus

  @Column({ type: 'enum', enum: ['public', 'private', 'invite_only'], default: 'public' })
  type: ProgramType

  @Column({ type: 'jsonb', nullable: true })
  scopes: {
    in_scope: string[]
    out_of_scope: string[]
  } | null

  @Column({ type: 'jsonb', nullable: true })
  rewards: {
    min: number
    max: number
    currency: string
  } | null

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null

  @Column({ type: 'timestamp', nullable: true })
  start_date: Date | null

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date | null

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @ManyToOne(() => User, user => user.programs)
  created_by: User

  @OneToMany(() => Finding, finding => finding.program)
  findings: Finding[]

  // Check if program is currently active
  isActive(): boolean {
    return this.status === 'active' && 
           (!this.start_date || this.start_date <= new Date()) &&
           (!this.end_date || this.end_date >= new Date())
  }

  // Get reward range as string
  getRewardRange(): string {
    if (!this.rewards) return 'Not specified'
    return `$${this.rewards.min} - $${this.rewards.max} ${this.rewards.currency}`
  }
}
