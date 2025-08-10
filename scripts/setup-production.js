#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Setting up mobile app for production deployment...\n');

// Function to ask for user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupProduction() {
  try {
    // Get Railway URL from user
    const railwayUrl = await askQuestion('Enter your Railway app URL (e.g., https://your-app.railway.app): ');
    
    if (!railwayUrl || !railwayUrl.startsWith('https://')) {
      console.error('❌ Please enter a valid HTTPS URL');
      process.exit(1);
    }

    // Update API files
    console.log('\n📝 Updating API configuration...');
    
    // Update lib/api.ts
    const apiFilePath = path.join(__dirname, '..', 'lib', 'api.ts');
    let apiContent = fs.readFileSync(apiFilePath, 'utf8');
    apiContent = apiContent.replace(
      /const prodApiUrl = 'https:\/\/your-railway-app\.railway\.app';/,
      `const prodApiUrl = '${railwayUrl}';`
    );
    fs.writeFileSync(apiFilePath, apiContent);
    console.log('✅ Updated lib/api.ts');

    // Update app/login.tsx
    const loginFilePath = path.join(__dirname, '..', 'app', 'login.tsx');
    let loginContent = fs.readFileSync(loginFilePath, 'utf8');
    loginContent = loginContent.replace(
      /const prodApiUrl = 'https:\/\/your-railway-app\.railway\.app';/,
      `const prodApiUrl = '${railwayUrl}';`
    );
    fs.writeFileSync(loginFilePath, loginContent);
    console.log('✅ Updated app/login.tsx');

    // Update app.json
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    appJson.expo.extra = appJson.expo.extra || {};
    appJson.expo.extra.apiUrl = railwayUrl;
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log('✅ Updated app.json');

    // Check if eas.json exists, if not create it
    const easJsonPath = path.join(__dirname, '..', 'eas.json');
    if (!fs.existsSync(easJsonPath)) {
      console.log('\n📝 Creating eas.json configuration...');
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

    console.log('\n🎉 Production setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Install EAS CLI: npm install -g @expo/eas-cli');
    console.log('2. Login to Expo: eas login');
    console.log('3. Build APK: npm run build:apk');
    console.log('\nYour Railway URL: ' + railwayUrl);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupProduction(); 