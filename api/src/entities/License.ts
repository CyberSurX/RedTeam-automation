import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./User.js"

@Entity("licenses")
export class License {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ unique: true })
    licenseKey: string // e.g. RTA-XXXX-YYYY-ZZZZ

    @Column({
        type: "enum",
        enum: ["active", "revoked", "expired", "suspended"],
        default: "active"
    })
    status: "active" | "revoked" | "expired" | "suspended"

    @Column({
        type: "enum",
        enum: ["basic", "pro", "enterprise"],
        default: "pro"
    })
    tier: "basic" | "pro" | "enterprise"

    @Column({ nullable: true })
    hardwareId: string // Used to lock the license to a specific machine/installation

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: "userId" })
    user: User

    @Column({ nullable: true })
    userId: string

    @Column({ nullable: true })
    stripePaymentIntentId: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
