import "reflect-metadata"
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./User.js"

@Entity("subscriptions")
export class Subscription {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "varchar" })
    stripeCustomerId: string

    @Column({ type: "varchar", nullable: true })
    stripeSubscriptionId: string

    @Column({
        type: "enum",
        enum: ["active", "past_due", "unpaid", "canceled", "incomplete", "incomplete_expired", "trialing", "inactive"],
        default: "inactive"
    })
    status: string

    @Column({ type: "varchar" })
    planId: string

    @Column({ type: "int", default: 0 })
    scanQuota: number

    @Column({ type: "int", default: 0 })
    scansUsed: number

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: "userId" })
    user: User

    @Column({ type: "uuid" })
    userId: string

    @Column({ type: "timestamp", nullable: true })
    currentPeriodEnd: Date

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
