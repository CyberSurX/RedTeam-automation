import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash passwords for sample users
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create sample users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@redteam.com' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'admin@redteam.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  const researcherUser = await prisma.user.upsert({
    where: { email: 'researcher@example.com' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'researcher@example.com',
      password: hashedPassword,
      name: 'Security Researcher',
      role: 'RESEARCHER',
    },
  })

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'user@example.com',
      password: hashedPassword,
      name: 'Regular User',
      role: 'USER',
    },
  })

  console.log('✅ Created sample users')

  // Create sample programs
  const programs = [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Web Application Security Program',
      description: 'Comprehensive bug bounty program for our web applications including the main dashboard, API endpoints, and user management systems.',
      status: 'ACTIVE',
      scope: 'app.redteam-automation.com, api.redteam-automation.com',
      rewards: { min: 100, max: 5000, currency: 'USD' },
      rules: 'Focus on XSS, SQL injection, authentication bypass, and privilege escalation. Out of scope: Third-party integrations, physical security, social engineering.',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      createdBy: adminUser.id,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      name: 'Mobile Application Security',
      description: 'Security testing program for our iOS and Android mobile applications.',
      status: 'ACTIVE',
      scope: 'iOS app version 2.0+, Android app version 2.0+',
      rewards: { min: 150, max: 3000, currency: 'USD' },
      rules: 'Test for insecure data storage, weak encryption, improper session handling, and reverse engineering vulnerabilities. Include jailbreak/root detection bypass.',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-11-30'),
      createdBy: adminUser.id,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      name: 'API Security Testing',
      description: 'Comprehensive API security assessment including GraphQL and REST endpoints.',
      status: 'DRAFT',
      scope: 'api.redteam-automation.com, graphql.redteam-automation.com',
      rewards: { min: 200, max: 4000, currency: 'USD' },
      rules: 'Focus on injection attacks, broken authentication, excessive data exposure, and rate limiting bypass. Test all API versions.',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-10-31'),
      createdBy: researcherUser.id,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440004',
      name: 'Infrastructure Security Assessment',
      description: 'Network and infrastructure security testing including cloud services and server configurations.',
      status: 'PAUSED',
      scope: 'AWS infrastructure, load balancers, databases, CI/CD pipeline',
      rewards: { min: 300, max: 10000, currency: 'USD' },
      rules: 'Test for misconfigurations, weak encryption, open ports, and privilege escalation in cloud infrastructure. Include container security assessment.',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-09-15'),
      createdBy: researcherUser.id,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440005',
      name: 'Blockchain Security Program',
      description: 'Smart contract and blockchain security testing for our DeFi protocols.',
      status: 'COMPLETED',
      scope: 'Smart contracts on Ethereum, Polygon, and BSC',
      rewards: { min: 500, max: 20000, currency: 'USD' },
      rules: 'Focus on reentrancy, integer overflow, access control, and economic attacks. Include formal verification where possible.',
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-12-31'),
      createdBy: adminUser.id,
    },
  ]

  for (const program of programs) {
    await prisma.program.upsert({
      where: { id: program.id },
      update: {},
      create: program,
    })
  }

  console.log('✅ Created sample programs')
  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })