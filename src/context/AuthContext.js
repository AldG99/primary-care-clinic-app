import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setLoading(true);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUser({
              ...currentUser,
              ...userDoc.data(),
            });
            setUserRole(userDoc.data().role);
          } else {
            setUser(currentUser);
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUser({
          ...auth.currentUser,
          ...userDoc.data(),
        });
        setUserRole(userDoc.data().role);
      }
    } catch (error) {
      console.error('Error al refrescar perfil de usuario:', error);
    }
  };

  const register = async (email, password, displayName, role, organization) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        displayName,
        role,
        organization,
        createdAt: new Date().toISOString(),
      });

      return user;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const hasPermission = requiredRole => {
    if (!userRole) return false;

    if (userRole === 'doctor') return true;

    if (userRole === 'nurse' && requiredRole === 'nurse') return true;

    return false;
  };

  const value = {
    user,
    userRole,
    loading,
    register,
    login,
    logout,
    hasPermission,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
