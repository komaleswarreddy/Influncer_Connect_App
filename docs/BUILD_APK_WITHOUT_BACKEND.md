# Build APK Without Backend

This guide will help you build and test the mobile app APK without setting up the backend first.

## 🚀 Quick Build (5 minutes)

### 1. Install EAS CLI

```bash
npm install -g @expo/eas-cli
```

### 2. Login to Expo

```bash
cd mobile
eas login
```

### 3. Build APK with Mock Data

```bash
npm run build:apk:dev
```

### 4. Download & Install

- Click the download link from the build
- Install APK on your Android device
- Test the app with mock data

## 🔧 What's Different in Development Build

### Mock Authentication

- Login works with any email/password (minimum 6 characters)
- Registration creates mock user accounts
- No real backend required

### Mock Data

- Uses JSONPlaceholder API for testing
- All API calls are mocked
- App functionality can be tested without backend

### Features You Can Test

- ✅ Login/Registration UI
- ✅ Navigation between screens
- ✅ App layout and design
- ✅ Form validation
- ✅ User interface interactions
- ✅ App performance

## 📱 Testing the App

### Login Testing

```
Email: any@email.com
Password: 123456 (or any 6+ characters)
```

### Registration Testing

- Fill out the registration form
- Any valid email and password will work
- Mock user account will be created

### App Navigation

- Test all screens and navigation
- Check if UI elements work correctly
- Verify app responsiveness

## 🔄 Switching to Production Later

When you're ready to connect to a real backend:

1. **Deploy the backend** to whatever host you're using (no hosting provider is set up yet — see `server/` and its `package.json` scripts).

2. **Update Mobile App** — set your deployed backend URL in `mobile/.env` (`EXPO_PUBLIC_API_URL=https://your-api-host`) or in `mobile/app.json` under `expo.extra.apiUrl`.

3. **Build Production APK**
   ```bash
   npm run build:apk
   ```

## 🐛 Troubleshooting

### Build Issues

```bash
# Check EAS CLI version
eas --version

# Check if logged in
eas whoami

# View build logs
eas build:list
```

### App Issues

- Make sure you have internet connection
- Check if APK is properly installed
- Clear app data if needed

### Mock Data Issues

- Mock login requires email and password
- Password must be at least 6 characters
- App will show loading states during mock API calls

## 📋 Development Checklist

- [ ] EAS CLI installed
- [ ] Expo account logged in
- [ ] APK built successfully
- [ ] App installed on device
- [ ] Login functionality working
- [ ] Navigation working
- [ ] UI elements responsive
- [ ] App performance good

## 🎯 Next Steps After Testing

1. **Deploy Backend** - to your chosen host (not yet decided)
2. **Connect Real API** - set `EXPO_PUBLIC_API_URL` in `mobile/.env`
3. **Build Production APK** - Run `npm run build:apk`
4. **Test with Real Data** - Verify all features work
5. **Deploy to App Store** - When ready for production

## 💡 Tips

- Use different email addresses to test multiple accounts
- Test on different screen sizes if possible
- Check app performance and loading times
- Test offline scenarios (app should handle gracefully)
- Document any UI/UX issues you find

## 🔗 Related Files

- `mobile/scripts/build-apk-dev.js` - Development build script
- `mobile/store/auth-store.ts` - Mock authentication logic
- `mobile/lib/api.ts` - API configuration
