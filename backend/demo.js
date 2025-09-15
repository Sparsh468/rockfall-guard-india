const axios = require('axios');

// Demo configuration
const BASE_URL = 'http://localhost:3001/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Demo function to show API usage
const demonstrateAPI = async () => {
  log('🎯 SHAIL KAVACH Backend Email System Demo', 'bright');
  log('=' .repeat(60), 'cyan');
  
  log('\n📋 This demo shows how to use the email API endpoints:', 'magenta');
  
  // Example 1: Health Check
  log('\n1️⃣ Health Check Endpoint:', 'yellow');
  log('   GET /api/health', 'blue');
  log('   Purpose: Check if the server and email service are running', 'blue');
  
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    log(`   ✅ Response: ${JSON.stringify(healthResponse.data, null, 2)}`, 'green');
  } catch (error) {
    log(`   ❌ Error: Server not running - ${error.message}`, 'red');
    log('   💡 Start the server with: npm start', 'yellow');
    return;
  }
  
  await delay(1000);
  
  // Example 2: Low Risk Alert
  log('\n2️⃣ Low Risk Alert:', 'yellow');
  log('   POST /api/send-alert', 'blue');
  log('   Body: {"riskLevel": "low", "mineName": "Goa Iron Ore", "location": "Goa, India"}', 'blue');
  
  try {
    const lowRiskResponse = await axios.post(`${BASE_URL}/send-alert`, {
      riskLevel: 'low',
      mineName: 'Goa Iron Ore Mine',
      location: 'Goa, India',
      additionalInfo: 'This is a demo low-risk alert from SHAIL KAVACH backend system.'
    });
    log(`   ✅ Response: ${JSON.stringify(lowRiskResponse.data, null, 2)}`, 'green');
  } catch (error) {
    log(`   ❌ Error: ${error.response?.data?.error || error.message}`, 'red');
  }
  
  await delay(2000);
  
  // Example 3: Medium Risk Alert
  log('\n3️⃣ Medium Risk Alert:', 'yellow');
  log('   POST /api/send-alert', 'blue');
  log('   Body: {"riskLevel": "medium", "mineName": "Bellary Iron Ore", "location": "Karnataka, India"}', 'blue');
  
  try {
    const mediumRiskResponse = await axios.post(`${BASE_URL}/send-alert`, {
      riskLevel: 'medium',
      mineName: 'Bellary Iron Ore Mine',
      location: 'Karnataka, India',
      additionalInfo: 'This is a demo medium-risk alert from SHAIL KAVACH backend system.'
    });
    log(`   ✅ Response: ${JSON.stringify(mediumRiskResponse.data, null, 2)}`, 'green');
  } catch (error) {
    log(`   ❌ Error: ${error.response?.data?.error || error.message}`, 'red');
  }
  
  await delay(2000);
  
  // Example 4: High Risk Alert
  log('\n4️⃣ High Risk Alert:', 'yellow');
  log('   POST /api/send-alert', 'blue');
  log('   Body: {"riskLevel": "high", "mineName": "Jharia Coalfield", "location": "Jharkhand, India"}', 'blue');
  
  try {
    const highRiskResponse = await axios.post(`${BASE_URL}/send-alert`, {
      riskLevel: 'high',
      mineName: 'Jharia Coalfield',
      location: 'Jharkhand, India',
      additionalInfo: 'This is a demo high-risk alert from SHAIL KAVACH backend system.'
    });
    log(`   ✅ Response: ${JSON.stringify(highRiskResponse.data, null, 2)}`, 'green');
  } catch (error) {
    log(`   ❌ Error: ${error.response?.data?.error || error.message}`, 'red');
  }
  
  await delay(2000);
  
  // Example 5: Test All Alerts
  log('\n5️⃣ Test All Alerts:', 'yellow');
  log('   POST /api/test-all-alerts', 'blue');
  log('   Purpose: Send test emails for all risk levels', 'blue');
  
  try {
    const allAlertsResponse = await axios.post(`${BASE_URL}/test-all-alerts`);
    log(`   ✅ Response: ${JSON.stringify(allAlertsResponse.data, null, 2)}`, 'green');
  } catch (error) {
    log(`   ❌ Error: ${error.response?.data?.error || error.message}`, 'red');
  }
  
  // Summary
  log('\n' + '=' .repeat(60), 'cyan');
  log('📊 DEMO SUMMARY', 'bright');
  log('=' .repeat(60), 'cyan');
  
  log('\n✅ API Endpoints Demonstrated:', 'green');
  log('   • GET /api/health - Health check', 'blue');
  log('   • POST /api/send-alert - Send individual alerts', 'blue');
  log('   • POST /api/test-all-alerts - Send all alert types', 'blue');
  
  log('\n📧 Email Types:', 'green');
  log('   • 🟢 Low Risk - Green alert with standard procedures', 'blue');
  log('   • 🟡 Medium Risk - Yellow alert with caution measures', 'blue');
  log('   • 🔴 High Risk - Red alert with immediate actions', 'blue');
  
  log('\n🔧 Integration Notes:', 'green');
  log('   • All emails are sent to the authenticated user', 'blue');
  log('   • Rich HTML templates with SHAIL KAVACH branding', 'blue');
  log('   • Professional styling with risk-specific colors', 'blue');
  log('   • Comprehensive error handling and validation', 'blue');
  
  log('\n📖 Next Steps:', 'yellow');
  log('   1. Configure your Gmail credentials in .env file', 'blue');
  log('   2. Start the server: npm start', 'blue');
  log('   3. Run tests: npm test', 'blue');
  log('   4. Integrate with your frontend application', 'blue');
  
  log('\n🎉 Demo completed successfully!', 'green');
};

// Run the demonstration
demonstrateAPI().catch(error => {
  log(`❌ Demo failed: ${error.message}`, 'red');
  process.exit(1);
});









