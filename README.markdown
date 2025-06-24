# MyMeow 🐾

A vibrant social networking app built for iOS and Android using **Vite (React)** and **Capacitor**, powered by **Firebase**. MyMeow lets you share fleeting notes with friends that vanish after 6 hours, creating a fun and ephemeral way to stay connected.
This pet project was made to learn and show my web development skills.
Also you can test it on TestFlight external testing program:
https://testflight.apple.com/join/NTT4fahX

## ✨ Features

- **Ephemeral Notes**: Share thoughts, updates, or moments with your friends that disappear after 6 hours.
- **Cross-Platform**: Seamlessly runs on both iOS and Android using Capacitor. (Android version is still not published)
- **Real-Time Updates**: Powered by Firebase for instant syncing and reliable data storage.
- **Modern Frontend**: Built with Vite and React for a fast, responsive, and delightful user experience.
- **Social Connectivity**: Connect with friends, view their notes, and engage in a private, time-bound social space.

## 🛠️ Tech Stack

- **Frontend**: Vite, React, Tailwind CSS, framer-motion
- **Mobile Integration**: Capacitor for iOS and Android, revenuecat (for premium)
- **Backend**: Firebase (Firestore, Authentication capacitor-firebase, Storage)
- **Language**: JavaScript
- **Deployment**: Capacitor for native builds 

## 🚀 Getting Started

Follow these steps to set up and run MyMeow locally.

### Prerequisites

- Node.js (v18 or higher)
- npm or Yarn
- Firebase account and project setup
- Capacitor CLI (`npm install -g @capacitor/cli`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/mymeow.git
   cd mymeow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Firebase**:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore, Authentication, and Storage.
   - Add your Firebase configuration to `src/firebase/config.js`:
     ```javascript
     export const firebaseConfig = {
       apiKey: "your-api-key",
       authDomain: "your-auth-domain",
       projectId: "your-project-id",
       storageBucket: "your-storage-bucket",
       messagingSenderId: "your-messaging-sender-id",
       appId: "your-app-id"
     };
     ```
   - Set up firebase native app, add needed files (GoogleService-info.plist for IOS)
   - Add database indexes:
     Collection ID - statuses
     Fields indexed: ownerId (Ascending), createdAt (Ascending), __name__ (Ascending)
     Query scope - Collection
   - Set up Apple development profile, Xcode, enable signin with Apple.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for native**:
   - Add platforms:
     ```bash
     npx cap add ios
     npx cap add android
     ```
   - Build the project:
     ```bash
     npm run build
     npx cap sync
     ```
   - Open in Xcode or Android Studio:
     ```bash
     npx cap open ios
     npx cap open android
     ```

### Firebase Setup

- Ensure Firestore rules allow read/write for authenticated users.
- Set up Firebase Authentication with desired providers (e.g., email, Google).
- Configure Firebase Storage for media uploads if needed.

## 📱 Running the App

- **Web**: Run `npm run dev` and open `http://localhost:5173` in your browser.
- **iOS/Android**: After building, use Xcode or Android Studio to deploy to a simulator or device.

## 🤝 Contributing

It is privat project. 

## 📄 License

Copyright (c) 2025 Maksym Hanych

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## 🙌 Acknowledgments

- [Vite](https://vitejs.dev/) for the blazing-fast build tool.
- [Capacitor](https://capacitorjs.com/) for cross-platform magic.
- [Firebase](https://firebase.google.com/) for a robust backend.
- All contributors and supporters of MyMeow! 🐾

---

🌟 **MyMeow** - Share a moment, make it fleeting, keep it meaningful.
