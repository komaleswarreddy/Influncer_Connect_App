#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting APK build process (Development Mode)...');
console.log('📱 This build will work without a backend - using mock data');

// Check if EAS CLI is installed
try {
  execSync('eas --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ EAS CLI is not installed. Please install it first:');
  console.error('npm install -g @expo/eas-cli');
  process.exit(1);
}

// Check if user is logged in to Expo
try {
  execSync('eas whoami', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ You are not logged in to Expo. Please run:');
  console.error('eas login');
  process.exit(1);
}

// Create eas.json if it doesn't exist
const easJsonPath = path.join(__dirname, '..', 'eas.json');
if (!fs.existsSync(easJsonPath)) {
  console.log('📝 Creating eas.json configuration...');
  const easConfig = {
    "cli": {
      "version": ">= 5.9.1"
    },
    "build": {
      "development": {
        "developmentClient": true,
        "distribution": "internal"
      },
      "preview": {
        "distribution": "internal",
        "android": {
          "buildType": "apk"
        }
      },
      "production": {
        "android": {
          "buildType": "apk"
        }
      }
    },
    "submit": {
      "production": {}
    }
  };
  
  fs.writeFileSync(easJsonPath, JSON.stringify(easConfig, null, 2));
  console.log('✅ Created eas.json');
}

// Update app.json to use mock API for development
console.log('🔧 Configuring app for development build...');
const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Set development API URL to mock service
appJson.expo.extra = appJson.expo.extra || {};
appJson.expo.extra.apiUrl = 'https://jsonplaceholder.typicode.com';

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
console.log('✅ Updated app.json for development build');

// Build APK
console.log('🔨 Building APK (Development Mode)...');
console.log('💡 This build uses mock data - no backend required!');
try {
  execSync('eas build --platform android --profile preview', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ APK build completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Download the APK from the link above');
  console.log('2. Install it on your Android device');
  console.log('3. Test the app with mock data');
  console.log('4. When ready for production, run: npm run setup:production');
} catch (error) {
  console.error('❌ APK build failed:', error.message);
  process.exit(1);
} 