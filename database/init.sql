-- RedTeam Automation Platform Database Schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS redteam_automation;
USE redteam_automation;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(500),
    scope TEXT,
    rewards JSON,
    status VARCHAR(50) DEFAULT 'active',
    automation_enabled BOOLEAN DEFAULT true,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reconnaissance jobs table
CREATE TABLE IF NOT EXISTS recon_jobs (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id),
    target_domain VARCHAR(255) NOT NULL,
    tools JSON,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    results JSON,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Scanning jobs table
CREATE TABLE IF NOT EXISTS scan_jobs (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id),
    target_hosts JSON NOT NULL,
    scan_type VARCHAR(50) NOT NULL,
    tools JSON,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    results JSON,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Exploitation jobs table
CREATE TABLE IF NOT EXISTS exploitation_jobs (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id),
    target_url VARCHAR(500) NOT NULL,
    vulnerability_type VARCHAR(100) NOT NULL,
    safety_level VARCHAR(20) DEFAULT 'safe',
    tools JSON,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    results JSON,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Findings table
CREATE TABLE IF NOT EXISTS findings (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id),
    job_id INTEGER,
    job_type VARCHAR(50),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    type VARCHAR(100),
    target VARCHAR(500),
    evidence JSON,
    remediation TEXT,
    cvss_score DECIMAL(3,1),
    cvss_vector VARCHAR(100),
    cwe_id VARCHAR(20),
    cve_id VARCHAR(20),
    false_positive BOOLEAN DEFAULT false,
    duplicate_of INTEGER REFERENCES findings(id),
    triaged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id),
    title VARCHAR(500) NOT NULL,
    template VARCHAR(100),
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    severity VARCHAR(20),
    findings JSON,
    bounty_amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    submission_response TEXT,
    report_url VARCHAR(500),
    submitted_by INTEGER REFERENCES users(id),
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Triage history table
CREATE TABLE IF NOT EXISTS triage_history (
    id SERIAL PRIMARY KEY,
    finding_id INTEGER REFERENCES findings(id),
    action VARCHAR(100) NOT NULL,
    reason TEXT,
    performed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions JSON,
    status VARCHAR(50) DEFAULT 'active',
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automation rules table
CREATE TABLE IF NOT EXISTS automation_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    conditions JSON,
    actions JSON,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tool configurations table
CREATE TABLE IF NOT EXISTS tool_configs (
    id SERIAL PRIMARY KEY,
    tool_name VARCHAR(100) NOT NULL,
    tool_type VARCHAR(50) NOT NULL,
    config JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Session tokens table
CREATE TABLE IF NOT EXISTS session_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Two-factor authentication table
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    secret VARCHAR(255) NOT NULL,
    backup_codes JSON,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_resource_type VARCHAR(50),
    related_resource_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_recon_jobs_status ON recon_jobs(status);
CREATE INDEX IF NOT EXISTS idx_recon_jobs_program_id ON recon_jobs(program_id);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_status ON scan_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_program_id ON scan_jobs(program_id);
CREATE INDEX IF NOT EXISTS idx_exploitation_jobs_status ON exploitation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_exploitation_jobs_program_id ON exploitation_jobs(program_id);
CREATE INDEX IF NOT EXISTS idx_findings_program_id ON findings(program_id);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_job_id ON findings(job_id);
CREATE INDEX IF NOT EXISTS idx_reports_program_id ON reports(program_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_triage_history_finding_id ON triage_history(finding_id);
CREATE INDEX IF NOT EXISTS idx_session_tokens_user_id ON session_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tokens_token ON session_tokens(token);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Insert default admin user (password: admin123 - change in production!)
INSERT INTO users (username, email, password_hash, role, is_active, two_factor_enabled) 
VALUES ('admin', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', true, false);

-- Insert default tool configurations
INSERT INTO tool_configs (tool_name, tool_type, config) VALUES
('amass', 'reconnaissance', '{"passive": true, "active": true, "brute_force": false}'),
('subfinder', 'reconnaissance', '{"sources": ["all"], "recursive": true}'),
('httpx', 'reconnaissance', '{"timeout": 10, "threads": 50, "follow_redirects": true}'),
('naabu', 'reconnaissance', '{"ports": "top-1000", "rate": 1000}'),
('nmap', 'scanning', '{"default_ports": true, "service_detection": true, "os_detection": false}'),
('nuclei', 'scanning', '{"templates": "all", "severity": ["critical", "high", "medium", "low"]}'),
('zap', 'scanning', '{"context": "bugbounty", "policy": "light"}'),
('nikto', 'scanning', '{"plugins": "all", "timeout": 10}'),
('sqlmap', 'exploitation', '{"level": 1, "risk": 1, "threads": 5}'),
('ffuf', 'exploitation', '{"wordlist": "common", "extensions": "txt,php,asp,aspx,jsp"}');

-- Insert default automation rules
INSERT INTO automation_rules (name, rule_type, conditions, actions, priority, is_active, created_by) VALUES
('Auto-triage Low Severity', 'triage', '{"severity": "low", "confidence": "low"}', '{"action": "mark_false_positive", "reason": "Low severity and confidence"}', 1, true, 1),
('Auto-report Critical', 'reporting', '{"severity": "critical", "confidence": "high"}', '{"action": "create_report", "template": "critical_vulnerability"}', 10, true, 1),
('Auto-scan New Domains', 'scanning', '{"new_domain": true, "program_active": true}', '{"action": "start_scan", "scan_type": "full"}', 5, true, 1);