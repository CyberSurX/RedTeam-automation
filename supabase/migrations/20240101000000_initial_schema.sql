-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- Create programs table
CREATE TABLE IF NOT EXISTS "programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scope" TEXT NOT NULL,
    "rewards" JSONB,
    "rules" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "programs" ADD CONSTRAINT "programs_createdBy_fkey" 
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "programs_createdBy_idx" ON "programs"("createdBy");
CREATE INDEX IF NOT EXISTS "programs_status_idx" ON "programs"("status");
CREATE INDEX IF NOT EXISTS "programs_name_idx" ON "programs"("name");

-- Enable Row Level Security
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "programs" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON "users"
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON "users"
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for programs table
CREATE POLICY "Anyone can view active programs" ON "programs"
    FOR SELECT USING (status = 'ACTIVE');

CREATE POLICY "Authenticated users can view all programs" ON "programs"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create programs" ON "programs"
    FOR INSERT WITH CHECK (auth.uid() = createdBy);

CREATE POLICY "Users can update their own programs" ON "programs"
    FOR UPDATE USING (auth.uid() = createdBy);

CREATE POLICY "Admins can manage all programs" ON "programs"
    FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');