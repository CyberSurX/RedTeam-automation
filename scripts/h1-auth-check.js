const axios = require('axios');

async function run() {
  const base = 'https://api.hackerone.com/v1';
  const username = process.env.HACKERONE_USERNAME || process.env.HACKERONE_EMAIL;
  const apiKey = process.env.HACKERONE_API_KEY;
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'RedTeamAutomation/1.0',
  };
  const auth = { username, password: apiKey };

  console.log('Testing LIVE authentication...');
  console.log('Using account:', process.env.HACKERONE_USERNAME || process.env.HACKERONE_EMAIL);

  const tryCall = async (label, url) => {
    try {
      const res = await axios.get(url, { headers, auth, timeout: 15000, validateStatus: () => true });
      console.log(`\n[${label}] Status:`, res.status);
      if (res.status >= 200 && res.status < 300) {
        const summary = JSON.stringify(res.data).slice(0, 400);
        console.log(`[${label}] Success body (truncated):`, summary);
      } else {
        console.log(`[${label}] Error body:`, JSON.stringify(res.data, null, 2));
      }
    } catch (e) {
      console.log(`\n[${label}] Request error:`);
      console.log('Message:', e.message);
      console.log('Status:', e.response?.status);
      console.log('Body:', JSON.stringify(e.response?.data, null, 2));
    }
  };

  await tryCall('ME', `${base}/hackers/me`);
  await tryCall('PROGRAMS', `${base}/hackers/programs`);
}

run();