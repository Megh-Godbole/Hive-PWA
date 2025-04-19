// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLF1q0zFElTvvrTVI7RSIPCcvgd8wrjM4",
  authDomain: "hive-pwa-final-project.firebaseapp.com",
  projectId: "hive-pwa-final-project",
  storageBucket: "hive-pwa-final-project.firebasestorage.app",
  messagingSenderId: "1056183165672",
  appId: "1:1056183165672:web:4498b34378767bbf305f5d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();