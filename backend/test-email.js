const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001/api';
const TEST_USER_EMAIL = 'testuser@gmail.com';

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

// Test individual alert
const testSingleAlert = async (riskLevel, mineName = 'Test Mine', location = 'Test Location') => {
  try {
    log(`\n🧪 Testing ${riskLevel.toUpperCase()} risk alert...`, 'cyan');
    
    const response = await axios.post(`${BASE_URL}/send-alert`, {
      riskLevel,
      mineName,
      location,
      additionalInfo: `This is a test ${riskLevel} risk alert from SHAIL KAVACH backend system. Generated at ${new Date().toLocaleString()}.`
    });

    if (response.data.success) {
      log(`✅ ${riskLevel.toUpperCase()} alert sent successfully!`, 'green');
      log(`   📧 Email sent to: ${response.data.data.userEmail}`, 'blue');
      log(`   📊 Risk Level: ${response.data.data.riskLevel}`, 'blue');
      log(`   🏭 Mine: ${response.data.data.mineName}`, 'blue');
      log(`   📍 Location: ${response.data.data.location}`, 'blue');
      log(`   📧 Message ID: ${response.data.data.messageId}`, 'blue');
      return true;
    } else {
      log(`❌ Failed to send ${riskLevel} alert: ${response.data.error}`, 'red');
      return false;
    }
  } catch (error) {
    if (error.response) {
      log(`❌ HTTP Error ${error.response.status}: ${error.response.data.error}`, 'red');
      log(`   Details: ${error.response.data.message || 'No details provided'}`, 'red');
    } else {
      log(`❌ Network Error: ${error.message}`, 'red');
    }
    return false;
  }
};

// Test all alerts
const testAllAlerts = async () => {
  try {
    log('\n🚀 Testing all alert types...', 'magenta');
    
    const response = await axios.post(`${BASE_URL}/test-all-alerts`);
    
    if (response.data.success) {
      log('✅ All test alerts completed!', 'green');
      log(`📧 Test emails sent to: ${response.data.userEmail}`, 'blue');
      
      response.data.results.forEach(result => {
        if (result.success) {
          log(`   ✅ ${result.riskLevel.toUpperCase()}: Sent (ID: ${result.messageId})`, 'green');
        } else {
          log(`   ❌ ${result.riskLevel.toUpperCase()}: Failed - ${result.error}`, 'red');
        }
      });
      
      return true;
    } else {
      log(`❌ Test failed: ${response.data.error}`, 'red');
      return false;
    }
  } catch (error) {
    if (error.response) {
      log(`❌ HTTP Error ${error.response.status}: ${error.response.data.error}`, 'red');
      log(`   Details: ${error.response.data.message || 'No details provided'}`, 'red');
    } else {
      log(`❌ Network Error: ${error.message}`, 'red');
    }
    return false;
  }
};

// Test health endpoint
const testHealth = async () => {
  try {
    log('\n🏥 Testing health endpoint...', 'cyan');
    
    const response = await axios.get(`${BASE_URL}/health`);
    
    if (response.data.status === 'healthy') {
      log('✅ Server is healthy!', 'green');
      log(`   📡 Service: ${response.data.service}`, 'blue');
      log(`   🔧 Version: ${response.data.version}`, 'blue');
      log(`   📧 SMTP Status: ${response.data.smtpStatus}`, 'blue');
      log(`   ⏰ Timestamp: ${response.data.timestamp}`, 'blue');
      return true;
    } else {
      log(`❌ Server health check failed: ${response.data.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    return false;
  }
};

// Test invalid requests
const testInvalidRequests = async () => {
  log('\n🔍 Testing invalid requests...', 'cyan');
  
  // Test invalid risk level
  try {
    await axios.post(`${BASE_URL}/send-alert`, {
      riskLevel: 'invalid'
    });
    log('❌ Should have failed with invalid risk level', 'red');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('✅ Correctly rejected invalid risk level', 'green');
    } else {
      log(`❌ Unexpected error for invalid risk level: ${error.message}`, 'red');
    }
  }
  
  // Test missing risk level
  try {
    await axios.post(`${BASE_URL}/send-alert`, {});
    log('❌ Should have failed with missing risk level', 'red');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('✅ Correctly rejected missing risk level', 'green');
    } else {
      log(`❌ Unexpected error for missing risk level: ${error.message}`, 'red');
    }
  }
  
  // Test invalid endpoint
  try {
    await axios.get(`${BASE_URL}/invalid-endpoint`);
    log('❌ Should have failed with 404', 'red');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      log('✅ Correctly returned 404 for invalid endpoint', 'green');
    } else {
      log(`❌ Unexpected error for invalid endpoint: ${error.message}`, 'red');
    }
  }
};

// Main test function
const runTests = async () => {
  log('🧪 SHAIL KAVACH Backend Email System Test Suite', 'bright');
  log('=' .repeat(50), 'cyan');
  
  // Check if server is running
  const isServerRunning = await testHealth();
  if (!isServerRunning) {
    log('\n❌ Server is not running or not accessible!', 'red');
    log('Please start the server with: npm start', 'yellow');
    process.exit(1);
  }
  
  // Wait a moment
  await delay(1000);
  
  // Test individual alerts
  log('\n📧 Testing individual alert types...', 'magenta');
  
  const testCases = [
    { riskLevel: 'low', mineName: 'Goa Iron Ore Mine', location: 'Goa, India' },
    { riskLevel: 'medium', mineName: 'Bellary Iron Ore Mine', location: 'Karnataka, India' },
    { riskLevel: 'high', mineName: 'Jharia Coalfield', location: 'Jharkhand, India' }
  ];
  
  let successCount = 0;
  for (const testCase of testCases) {
    const success = await testSingleAlert(testCase.riskLevel, testCase.mineName, testCase.location);
    if (success) successCount++;
    
    // Add delay between tests
    await delay(2000);
  }
  
  log(`\n📊 Individual Tests: ${successCount}/${testCases.length} passed`, successCount === testCases.length ? 'green' : 'yellow');
  
  // Test all alerts endpoint
  await delay(2000);
  const allAlertsSuccess = await testAllAlerts();
  
  // Test invalid requests
  await testInvalidRequests();
  
  // Final summary
  log('\n' + '=' .repeat(50), 'cyan');
  log('📋 TEST SUMMARY', 'bright');
  log('=' .repeat(50), 'cyan');
  
  if (successCount === testCases.length && allAlertsSuccess) {
    log('🎉 ALL TESTS PASSED!', 'green');
    log('✅ Backend email system is working correctly', 'green');
    log(`📧 Test emails should be delivered to: ${TEST_USER_EMAIL}`, 'blue');
  } else {
    log('⚠️  SOME TESTS FAILED', 'yellow');
    log('Please check the server logs and configuration', 'yellow');
  }
  
  log('\n📝 Test completed at:', new Date().toLocaleString());
  log('🔗 Check your email inbox for test messages', 'blue');
};

// Run tests
runTests().catch(error => {
  log(`❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});









