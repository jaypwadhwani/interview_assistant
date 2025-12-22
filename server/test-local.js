// Quick test to verify backend setup
require('dotenv').config();

console.log('Testing backend setup...\n');

// Check if OpenAI key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY not found in environment');
  console.log('Please create a .env file in the server/ folder with:');
  console.log('OPENAI_API_KEY=your_key_here\n');
  process.exit(1);
} else {
  console.log('✅ OPENAI_API_KEY is set');
}

// Check if dependencies are installed
try {
  require('express');
  require('openai');
  require('cors');
  require('multer');
  console.log('✅ All dependencies are installed');
} catch (err) {
  console.error('❌ ERROR: Dependencies not installed');
  console.log('Please run: cd server && npm install\n');
  process.exit(1);
}

console.log('\n✅ Backend setup looks good!');
console.log('You can now run: cd server && npm start');

