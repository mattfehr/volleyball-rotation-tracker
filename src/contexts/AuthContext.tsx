import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

//authentiacion context type to share data
type AuthContextType = {
  user: User | null;
  username: string | null;
};

//global context container for auth info with defaults values of null for not being logged in
const AuthContext = createContext<AuthContextType>({ user: null, username: null });

//Auth provider component wrapper to track the firebase auth state, watch for log outs/ins and share info everywhere
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  
  //hold current users id and username as well as there setters
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  //listener to watch for log outs and log ins
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {  //when auth state changes, change the user id state
      setUser(firebaseUser);

      //when user logs in, it chekcs firestore for his document and finds his user name
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUsername(docSnap.data().username || null);
        } else {
          setUsername(null);
        }
      } else {
        setUsername(null);
      }
    });

    return () => unsubscribe(); //when this component stops, stop listening for auth changes
  }, []);

  return (
    //shares user and username with the rest of the app contained
    <AuthContext.Provider value={{ user, username }}>
      {children}
    </AuthContext.Provider>
  );
};

//hook to make user and username globally accessible
export const useAuth = () => useContext(AuthContext);
