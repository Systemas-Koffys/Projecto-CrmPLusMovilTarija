import { useState, useEffect, createContext, useContext } from 'react';
import { auth, isFirebaseConfigured } from '../config/firebase';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if there is a local demo token stored to persist session
    const localToken = localStorage.getItem('authToken');
    const localEmail = localStorage.getItem('userEmail');
    if (localToken === 'demo-token-prueba-gmail-com' && localEmail === 'prueba@gmail.com') {
      api.post('/api/auth/verify', { email: localEmail })
        .then((userData) => {
          setUser({
            uid: 'demo-user-id',
            email: localEmail,
            ...userData,
          });
          setRole(userData.role);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error auto-verifying demo user:', err);
          setUser(null);
          setRole(null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userRole');
          setLoading(false);
        });
      return;
    }

    if (!isFirebaseConfigured || !auth) {
      console.warn('⚠️ Firebase no configurado. Configura las variables VITE_FIREBASE_* en .env');
      setLoading(false);
      return;
    }

    import('firebase/auth').then(({ onAuthStateChanged }) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            localStorage.setItem('authToken', token);

            const userData = await api.post('/api/auth/verify', {
              email: firebaseUser.email,
            });

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData,
            });
            setRole(userData.role);
          } catch (err) {
            console.error('Error verificando usuario:', err);
            setUser(null);
            setRole(null);
            localStorage.removeItem('authToken');
          }
        } else {
          setUser(null);
          setRole(null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userEmail');
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }).catch((err) => {
      console.error('Error cargando Firebase Auth:', err);
      setLoading(false);
    });
  }, []);

  const login = async (email, password) => {
    // Bypass Firebase for demo account
    if (email === 'prueba@gmail.com' && password === 'prueba123') {
      setLoading(true);
      setError(null);
      try {
        const dummyToken = 'demo-token-prueba-gmail-com';
        localStorage.setItem('authToken', dummyToken);
        const userData = await api.post('/api/auth/verify', { email });
        setUser({
          uid: 'demo-user-id',
          email,
          ...userData,
        });
        setRole(userData.role);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userEmail', email);
        return userData;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    }

    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase no está configurado. Revisa las variables de entorno.');
    }

    setLoading(true);
    setError(null);
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      localStorage.setItem('authToken', token);

      const userData = await api.post('/api/auth/verify', { email });

      setUser({
        uid: result.user.uid,
        email: result.user.email,
        ...userData,
      });
      setRole(userData.role);
      localStorage.setItem('userRole', userData.role);
      localStorage.setItem('userEmail', email);

      return userData;
    } catch (err) {
      const message = getFirebaseErrorMessage(err.code || err.message);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase no está configurado. Revisa las variables de entorno.');
    }

    setLoading(true);
    setError(null);
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      
      // Force account selection screen
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem('authToken', token);

      const email = result.user.email;
      const userData = await api.post('/api/auth/verify', { email });

      setUser({
        uid: result.user.uid,
        email,
        ...userData,
      });
      setRole(userData.role);
      localStorage.setItem('userRole', userData.role);
      localStorage.setItem('userEmail', email);

      return userData;
    } catch (err) {
      let message = 'Error al iniciar sesión con Google';
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'El inicio de sesión fue cancelado';
      } else if (err.message && err.message.includes('Usuario no encontrado')) {
        message = 'Tu correo de Google no está registrado en el sistema.';
      } else if (err.code) {
        message = getFirebaseErrorMessage(err.code);
      }
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (auth) {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      }
      setUser(null);
      setRole(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, error, login, loginWithGoogle, logout, isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

function getFirebaseErrorMessage(code) {
  const messages = {
    'auth/invalid-email': 'Email no válido',
    'auth/user-disabled': 'Cuenta deshabilitada',
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/invalid-credential': 'Credenciales inválidas',
    'auth/too-many-requests': 'Demasiados intentos, intenta más tarde',
    'auth/network-request-failed': 'Error de conexión',
  };
  return messages[code] || 'Error de autenticación';
}

export default AuthContext;
