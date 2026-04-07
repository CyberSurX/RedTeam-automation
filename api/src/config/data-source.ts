import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from '../entities/User.js'
import { Program } from '../entities/Program.js'
import { Finding } from '../entities/Finding.js'
import { Report } from '../entities/Report.js'
import { Mission } from '../entities/Mission.js'
import { TaskResult } from '../entities/TaskResult.js'
import { ScopeAgreement } from '../entities/ScopeAgreement.js'
import { AgentHealth } from '../entities/AgentHealth.js'
import { AuditLog } from '../entities/AuditLog.js'
import { Job } from '../entities/Job.js'
import { JobLog } from '../entities/JobLog.js'
import { ApiKey } from '../entities/ApiKey.js'

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5433,
    username: "postgres",
    password: "postgres",
    database: "redteam_automation",
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV !== "production",
    entities: [User, Program, Finding, Report, Mission, TaskResult, ScopeAgreement, AgentHealth, AuditLog, Job, JobLog, ApiKey],
    migrations: [],
    subscribers: [],
})

export const initializeDatabase = async () => {
    try {
        await AppDataSource.initialize()
        console.log("✅ Data Source has been initialized!")
        
        // Create default admin user if not exists
        const userRepository = AppDataSource.getRepository(User)
        const adminEmail = 'admin@cybersurhub.com'
        const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } })
        
        if (!existingAdmin) {
            const adminUser = userRepository.create({
                email: adminEmail,
                name: 'RedTeam Admin',
                password_hash: 'Admin@12345!', // This will be hashed by the User entity's BeforeInsert hook
                role: 'admin'
            })
            await userRepository.save(adminUser)
            console.log(`✅ Default admin user created! Email: ${adminEmail}`)
        } else {
            // Update password just in case they forgot it during testing
            existingAdmin.password_hash = 'Admin@12345!' // Hash it again
            await userRepository.save(existingAdmin)
            console.log(`✅ Default admin user verified! Email: ${adminEmail}`)
        }
        
    } catch (err) {
        const message = (err as Error)?.message || String(err)
        console.warn("⚠️  Database not available - continuing without database. Some features will be limited:", message)
    }
}
