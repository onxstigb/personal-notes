# Personal Notes

Personal Notes is a mobile note-taking app built with React Native and Expo. It lets users create an account, sign in, and manage personal notes in a clean, lightweight interface. Notes are stored in Firebase so they remain available across sessions and devices for the same authenticated user.

## Features

- Email/password sign up and login
- Secure authentication with Firebase Auth
- Create, view, edit, and delete notes
- Mark favorite notes for quick access
- Filter the list to show only favorite notes
- Simple account screen with logout
- Real-time note syncing with Firestore

## Tech Stack

- React Native
- Expo
- Firebase Authentication
- Cloud Firestore
- React Navigation

## Project Structure

- `App.js` – main app logic and UI
- `src/firebase.js` – Firebase initialization and exports
- `assets/` – app icons and branding files

## Running the App

1. Install dependencies:
   
   ```bash
   npm install
   ```

2. Start the Expo development server:
   
   ```bash
   npm start
   ```

   Or, if you prefer the Expo CLI directly:
   
   ```bash
   npx expo start
   ```

3. Open the app:
   - Install the Expo Go app on your iPhone or Android device
   - Scan the QR code shown in the terminal
   - Or run it in a simulator with:
     
     ```bash
     npm run android
     ```
     
     or
     
     ```bash
     npm run ios
     ```

## Firebase Setup

This app uses Firebase for authentication and note storage. The configuration is already initialized in `src/firebase.js`, but for a production or personal setup you should replace the config values with your own Firebase project settings.

If you want to use your own Firebase project:

1. Create a Firebase project in the Firebase console
2. Enable Email/Password authentication
3. Create a Firestore database
4. Update the config object in `src/firebase.js`

## Notes

This application is designed as a personal note-taking app and is best suited for local development or personal use. If you want to expand it, a natural next step would be adding search, note categories, or cloud backups.
