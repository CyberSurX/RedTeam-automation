import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('scope_agreements')
export class ScopeAgreement {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  client_name!: string

  @Column({ type: 'jsonb' })
  authorized_targets!: string

  @Column({ type: 'jsonb', default: '[]' })
  excluded_targets!: string

  @Column({ type: 'timestamp' })
  valid_from!: Date

  @Column({ type: 'timestamp' })
  valid_until!: Date

  @Column({ type: 'varchar' })
  authorized_by!: string

  @Column({ type: 'varchar', nullable: true })
  scope_hash!: string

  @CreateDateColumn()
  created_at!: Date
}
