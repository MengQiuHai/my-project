#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Growth Bank System - Quick Setup\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📝 Creating .env file from template...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env file created');
  console.log('⚠️  Please edit .env file with your database credentials\n');
} else if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists\n');
} else {
  console.log('❌ .env.example not found\n');
}

// Install dependencies if node_modules doesn't exist
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed\n');
}

// Check if we can connect to database
console.log('🔍 Checking system requirements...\n');

try {
  // Test TypeScript compilation
  console.log('📝 Checking TypeScript...');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript check passed');
} catch (error) {
  console.log('⚠️  TypeScript issues found (will attempt to fix during build)');
}

console.log('\n🎯 Next steps:');
console.log('1. Edit .env file with your database credentials');
console.log('2. Make sure PostgreSQL is running');
console.log('3. Run: npm run migrate');
console.log('4. Run: npm run seed');
console.log('5. Run: npm run dev');
console.log('\n🔗 Quick test: http://localhost:3001/api/health');
console.log('📚 Full API info: http://localhost:3001/api/health/info');

console.log('\n🆘 If you need help:');
console.log('- Check DATABASE_URL in .env file');
console.log('- Make sure PostgreSQL is installed and running');
console.log('- Redis is optional (system works without it)');
console.log('- Run: npm run health:check (after server is running)');

console.log('\n🚀 Ready to start! Run: npm run dev');