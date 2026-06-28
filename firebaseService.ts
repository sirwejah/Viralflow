
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
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { UserProfile, VideoIdea } from "./types";

// Updated configuration from the user's latest Firebase console snippet
const firebaseConfig = {
  apiKey: "AIzaSyCpaKoTdC-VBCWH3UucXJa4tByKoSOnxL0",
  authDomain: "gen-lang-client-0351622713.firebaseapp.com",
  projectId: "gen-lang-client-0351622713",
  storageBucket: "gen-lang-client-0351622713.firebasestorage.app",
  messagingSenderId: "434616002983",
  appId: "1:434616002983:web:8cc6ccbb9f3b7013a6ee82",
  measurementId: "G-QY63L5P359"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-0019d84d-a814-43ee-8076-5e68b5d355aa");

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

export const subscribeToProfile = (uid: string, callback: (profile: UserProfile | null) => void) => {
  const docRef = doc(db, "profiles", uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserProfile);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Profile subscription error:", error);
    callback(null);
  });
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

export const subscribeToIdeas = (uid: string, callback: (ideas: VideoIdea[]) => void) => {
  const colRef = collection(db, "profiles", uid, "ideas");
  const q = query(colRef, orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (querySnapshot) => {
    const ideas = querySnapshot.docs.map(doc => ({ 
      ...doc.data() as VideoIdea,
      id: doc.id 
    }));
    callback(ideas);
  }, (error) => {
    console.error("Ideas subscription error:", error);
    // Fallback if index is missing: try without ordering
    if (error.message.includes("index")) {
      onSnapshot(collection(db, "profiles", uid, "ideas"), (snap) => {
        const ideas = snap.docs.map(doc => ({ 
          ...doc.data() as VideoIdea,
          id: doc.id 
        }));
        callback(ideas);
      });
    }
  });
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

export const updateIdea = async (uid: string, ideaId: string, partialIdea: Partial<VideoIdea>) => {
  const docRef = doc(db, "profiles", uid, "ideas", ideaId);
  await updateDoc(docRef, partialIdea);
};

