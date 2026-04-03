import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./User.js"

@Entity("subscriptions")
export class Subscription {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    stripeCustomerId: string

    @Column({ nullable: true })
    stripeSubscriptionId: string

    @Column({
        type: "enum",
        enum: ["active", "past_due", "unpaid", "canceled", "incomplete", "incomplete_expired", "trialing", "inactive"],
        default: "inactive"
    })
    status: string

    @Column()
    planId: string

    @Column({ default: 0 })
    scanQuota: number

    @Column({ default: 0 })
    scansUsed: number

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: "userId" })
    user: User

    @Column()
    userId: string

    @Column({ nullable: true })
    currentPeriodEnd: Date

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
