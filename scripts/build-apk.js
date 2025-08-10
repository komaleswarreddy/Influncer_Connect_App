#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting APK build process...');

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

// Build APK
console.log('🔨 Building APK...');
try {
  execSync('eas build --platform android --profile preview', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ APK build completed successfully!');
} catch (error) {
  console.error('❌ APK build failed:', error.message);
  process.exit(1);
} 