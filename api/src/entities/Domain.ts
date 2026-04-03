import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./User.js"

@Entity("domains")
export class Domain {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    domain: string

    @Column({
        type: "enum",
        enum: ["pending", "verified", "failed"],
        default: "pending"
    })
    status: "pending" | "verified" | "failed"

    @Column()
    verificationToken: string

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: "userId" })
    user: User

    @Column()
    userId: string

    @Column({ nullable: true })
    verifiedAt: Date

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
