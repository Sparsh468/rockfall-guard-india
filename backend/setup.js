const fs = require('fs');
const path = require('path');

console.log('🚀 SHAIL KAVACH Backend Email System Setup');
console.log('=' .repeat(50));

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
  } else {
    console.log('❌ env.example file not found!');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

console.log('\n🔧 Configuration Steps:');
console.log('1. Edit the .env file with your Gmail credentials');
console.log('2. Set EMAIL_USER to your Gmail address');
console.log('3. Set EMAIL_PASS to your Gmail App Password');
console.log('4. Run: npm start (or npm run dev for development)');
console.log('5. Test with: npm test');

console.log('\n📧 Gmail App Password Setup:');
console.log('1. Enable 2-Factor Authentication on your Gmail account');
console.log('2. Go to Google Account Settings → Security → 2-Step Verification');
console.log('3. Click "App passwords"');
console.log('4. Select "Mail" and generate a password');
console.log('5. Use the 16-character password in your .env file');

console.log('\n🧪 Testing:');
console.log('- Health check: GET http://localhost:3001/api/health');
console.log('- Send alert: POST http://localhost:3001/api/send-alert');
console.log('- Test all: npm test');

console.log('\n📖 Documentation: README.md');
console.log('=' .repeat(50));









