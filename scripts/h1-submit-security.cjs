const axios = require('axios');

async function main() {
  const base = 'https://api.hackerone.com/v1';
  const username = process.env.HACKERONE_USERNAME;
  const apiKey = process.env.HACKERONE_API_KEY;
  if (!username || !apiKey) {
    console.error('Missing HACKERONE_USERNAME or HACKERONE_API_KEY');
    process.exit(1);
  }
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'RedTeamAutomation/1.0',
    'Authorization': 'Basic ' + Buffer.from(`${username}:${apiKey}`).toString('base64'),
  };

  // 1) Get programs
  const progRes = await axios.get(base + '/hackers/programs?limit=50', { headers, validateStatus: () => true });
  if (progRes.status !== 200) {
    console.log('Programs fetch failed', progRes.status, JSON.stringify(progRes.data));
    process.exit(1);
  }
  const programs = progRes.data.data;
  const security = programs.find(p => p.attributes && p.attributes.handle === 'security');
  if (!security) {
    console.log('Security program not found');
    process.exit(1);
  }
  const programId = security.id;
  console.log('Target program id:', programId, 'name:', security.attributes.name);

  // 2) Submit report with relationships.program
  const payload = {
    data: {
      type: 'report',
      attributes: {
        title: 'Automated DoS Vulnerability Check',
        summary: 'Automated tester detected potential rate-limit bypass causing denial of service. Live connectivity validation.',
        severity_rating: 'medium',
        vulnerability_information: 'Steps to reproduce: send N concurrent requests exceeding rate limit; observe service unavailability.'
      },
      relationships: {
        program: {
          data: { type: 'program', id: programId }
        }
      }
    }
  };

  const subRes = await axios.post(base + '/hackers/reports', payload, { headers, validateStatus: () => true });
  console.log('Submit status:', subRes.status);
  console.log('Submit body:', JSON.stringify(subRes.data));
}

main().catch(e => {
  console.error('Submit error:', e.message);
  if (e.response) console.error('Body:', JSON.stringify(e.response.data));
  process.exit(1);
});