import "reflect-metadata"
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./User.js"

@Entity("licenses")
export class License {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "varchar", unique: true })
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

    @Column({ type: "varchar", nullable: true })
    hardwareId: string // Used to lock the license to a specific machine/installation

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: "userId" })
    user: User

    @Column({ type: "uuid", nullable: true })
    userId: string

    @Column({ type: "varchar", nullable: true })
    stripePaymentIntentId: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
