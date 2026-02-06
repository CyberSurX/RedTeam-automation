# TypeORM Database Entities

Database models and table definitions using TypeORM decorators.

## 📁 Structure

```
entities/
├── User.ts           # User account model
├── Program.ts        # Bug bounty program model
├── Finding.ts        # Vulnerability finding model
└── Report.ts         # Security report model
```

---

## 👤 User Entity

### Purpose
Represents a user account in the system.

### Properties

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| username | string | Unique username |
| email | string | Unique email address |
| password | string | Hashed password (bcrypt) |
| role | enum | User role: admin, user, viewer |
| created_at | timestamp | Account creation time |
| updated_at | timestamp | Last update time |

### Relationships

- One-to-Many with `Program` (created programs)
- One-to-Many with `Finding` (submitted findings)
- One-to-Many with `Report` (generated reports)

### Example Usage

```typescript
import { User } from '../entities/User';

const user = new User();
user.username = 'securityresearcher';
user.email = 'researcher@example.com';
user.password = await bcrypt.hash('password123', 12);
user.role = 'user';
```

---

## 📋 Program Entity

### Purpose
Represents a bug bounty program from HackerOne, Bugcrowd, or Devpost.

### Properties

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | string | Program name |
| platform | enum | Platform: hackerone, bugcrowd, devpost |
| programId | string | External program ID |
| scope | string | Scope definition |
| bountyRange | string | Bounty amount range |
| status | enum | Status: active, paused, closed |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

### Relationships

- Many-to-One with `User` (creator)

---

## 🔍 Finding Entity

### Purpose
Represents a vulnerability finding discovered during security testing.

### Properties

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | string | Finding title |
| description | text | Detailed description |
| severity | enum | Severity: critical, high, medium, low, informational |
| status | enum | Status: draft, submitted, resolved |
| programId | UUID | Related program |
| userId | UUID | Finding submitter |
| submittedToPlatform | boolean | Whether submitted to platform |
| platformFindingId | string | External finding ID |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update time |

### Relationships

- Many-to-One with `Program`
- Many-to-One with `User`
- One-to-Many with `Report`

---

## 📄 Report Entity

### Purpose
Represents a security assessment report with multiple findings.

### Properties

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | string | Report title |
| summary | text | Executive summary |
| status | enum | Status: draft, submitted, reviewed, approved |
| type | enum | Type: vulnerability_assessment, penetration_test, etc. |
| targetInfo | jsonb | Target information |
| riskAssessment | jsonb | Risk analysis |
| recommendations | jsonb | Remediation recommendations |
| metadata | jsonb | Additional metadata |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update time |

### Relationships

- Many-to-One with `User` (creator)
- One-to-Many with `Finding`

---

## 🔧 Entity Configuration

All entities use TypeORM decorators:

```typescript
@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  property!: type;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
```

---

## 🚀 Database Synchronization

In development mode, TypeORM automatically creates and updates tables:

```typescript
// data-source.ts
export const AppDataSource = new DataSource({
  synchronize: process.env.NODE_ENV !== "production",
  // ...
});
```

This means you don't need to write SQL migrations during development.

---

## 🔗 Relationship Examples

```typescript
// Many-to-One
@ManyToOne(() => Program, program => program.findings)
program!: Program;

// One-to-Many
@OneToMany(() => Finding, finding => finding.program)
findings!: Finding[];

// Many-to-One with cascade
@ManyToOne(() => User, user => user.findings)
user!: User;
```