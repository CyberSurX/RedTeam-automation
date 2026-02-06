import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from '../entities/User'
import { Program } from '../entities/Program'
import { Finding } from '../entities/Finding'
import { Report } from '../entities/Report'

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    username: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "redteam_automation",
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV !== "production",
    entities: [User, Program, Finding, Report],
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