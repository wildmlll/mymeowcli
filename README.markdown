# MyMeow 🐾

A vibrant social networking app built for iOS and Android using **Vite (React)** and **Capacitor**, powered by **Firebase**. MyMeow lets you share fleeting notes with friends that vanish after 6 hours, creating a fun and ephemeral way to stay connected.

## ✨ Features

- **Ephemeral Notes**: Share thoughts, updates, or moments with your friends that disappear after 6 hours.
- **Cross-Platform**: Seamlessly runs on both iOS and Android using Capacitor.
- **Real-Time Updates**: Powered by Firebase for instant syncing and reliable data storage.
- **Modern Frontend**: Built with Vite and React for a fast, responsive, and delightful user experience.
- **Social Connectivity**: Connect with friends, view their notes, and engage in a private, time-bound social space.

## 🛠️ Tech Stack

- **Frontend**: Vite, React, Tailwind CSS
- **Mobile Integration**: Capacitor for iOS and Android
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Language**: JavaScript/TypeScript
- **Deployment**: Capacitor for native builds, Firebase Hosting (optional)

## 🚀 Getting Started

Follow these steps to set up and run MyMeow locally.

### Prerequisites

- Node.js (v16 or higher)
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

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for mobile**:
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

We welcome contributions! To get started:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md) and ensure your code adheres to the project's style guidelines.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙌 Acknowledgments

- [Vite](https://vitejs.dev/) for the blazing-fast build tool.
- [Capacitor](https://capacitorjs.com/) for cross-platform magic.
- [Firebase](https://firebase.google.com/) for a robust backend.
- All contributors and supporters of MyMeow! 🐾

---

🌟 **MyMeow** - Share a moment, make it fleeting, keep it meaningful.