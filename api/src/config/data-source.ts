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
    } catch (err) {
        const message = (err as Error)?.message || String(err)
        console.warn("⚠️  Database not available - continuing without database. Some features will be limited:", message)
    }
}
