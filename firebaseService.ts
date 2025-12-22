
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  addDoc,
  query,
  getDocs,
  orderBy,
  deleteDoc
} from "firebase/firestore";
import { UserProfile, VideoIdea } from "./types";

// Updated configuration from the user's latest Firebase console snippet
const firebaseConfig = {
  apiKey: "AIzaSyCKnkGjB_9-Sh8rf8Ulvxb0EJRIo-fnvLQ",
  authDomain: "viralflow-3bfba.firebaseapp.com",
  projectId: "viralflow-3bfba",
  storageBucket: "viralflow-3bfba.firebasestorage.app",
  messagingSenderId: "172256574572",
  appId: "1:172256574572:web:1262c5e5dd4960293fac49",
  measurementId: "G-VEXVHCNKQK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const signUpUser = async (email: string, password: string, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // Create initial empty profile
  await setDoc(doc(db, "profiles", userCredential.user.uid), {
    name,
    platforms: [],
    creatorType: 'Personal Brand',
    niche: [],
    plan: 'Starter'
  });
  return userCredential.user;
};

export const signInUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = () => signOut(auth);

export const getProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, "profiles", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const saveProfile = async (uid: string, profile: UserProfile) => {
  await setDoc(doc(db, "profiles", uid), profile);
};

export const updateProfile = async (uid: string, partialProfile: Partial<UserProfile>) => {
  await updateDoc(doc(db, "profiles", uid), partialProfile);
};

// --- Ideas Persistence ---

export const getIdeas = async (uid: string): Promise<VideoIdea[]> => {
  const colRef = collection(db, "profiles", uid, "ideas");
  // Using createdAt for reliable chronological sorting (requires index in Firestore)
  const q = query(colRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ 
    ...doc.data() as VideoIdea,
    id: doc.id 
  }));
};

export const addIdea = async (uid: string, idea: Omit<VideoIdea, 'id'>) => {
  const colRef = collection(db, "profiles", uid, "ideas");
  const docRef = await addDoc(colRef, {
    ...idea,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const deleteIdea = async (uid: string, ideaId: string) => {
  const docRef = doc(db, "profiles", uid, "ideas", ideaId);
  await deleteDoc(docRef);
};
