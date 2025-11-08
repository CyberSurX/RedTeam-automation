/**
 * User entity with TypeORM decorators
 * Represents user accounts with role-based access control
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm'
import { Program } from './Program'
import { Finding } from './Finding'
import { Report } from './Report'
import bcrypt from 'bcrypt'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  password_hash: string

  @Column()
  name: string

  @Column({ type: 'enum', enum: ['admin', 'user', 'viewer'], default: 'user' })
  role: 'admin' | 'user' | 'viewer'

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, any>

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @OneToMany(() => Program, program => program.created_by)
  programs: Program[]

  @OneToMany(() => Finding, finding => finding.researcher)
  findings: Finding[]

  @OneToMany(() => Report, report => report.created_by)
  reports: Report[]

  // Hash password before saving
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password_hash && !this.password_hash.startsWith('$2b$')) {
      this.password_hash = await bcrypt.hash(this.password_hash, 12)
    }
  }

  // Validate password
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash)
  }

  // Get public profile (exclude sensitive data)
  getPublicProfile(): Omit<User, 'password_hash'> {
    const { password_hash, ...publicProfile } = this
    return publicProfile
  }
}