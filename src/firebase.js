
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCyQcGdeyEt6XeVY0PfJH4X1phmOlFL5Ow",
  authDomain: "webclasses-8320e.firebaseapp.com",
  projectId: "webclasses-8320e",
  storageBucket: "webclasses-8320e.firebasestorage.app",
  messagingSenderId: "797745653605",
  appId: "1:797745653605:web:ca7d0af1c2d420747be38c",
  measurementId: "G-VVB791Z4M2"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
