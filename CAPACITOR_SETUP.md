# NEXUS Android App — Capacitor Setup

## Prerequisites
- Node.js 18+
- Android Studio with SDK 34+
- Java 17+

## Setup Steps

1. Install Capacitor:
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npx cap init NEXUS com.nexus.chat --web-dir dist
```

2. Build the web app:
```bash
npm run build
```

3. Add Android platform:
```bash
npx cap add android
npx cap sync
```

4. Open in Android Studio:
```bash
npx cap open android
```

5. Run on device/emulator from Android Studio.

## Environment
Set API URL in the build for production.

## Notes
- The app uses 100dvh and safe-area-insets — both work in Android WebView
- viewport-fit=cover is set in index.html
- No native plugins needed for basic chat functionality
- Push notifications will need @capacitor/push-notifications later
