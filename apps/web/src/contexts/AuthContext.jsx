
import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { getAppPath } from '@/lib/runtimeUrls.js';
import { normalizeBranch } from '@/lib/branchOptions.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedCounter, _setSelectedCounter] = useState(() => {
    return localStorage.getItem('selectedCounter') || null;
  });
  const [selectedBranch, _setSelectedBranch] = useState(() => {
    return localStorage.getItem('selectedBranch') || null;
  });

  const getSelectedCounter = () => {
    return localStorage.getItem('selectedCounter');
  };

  const getSelectedBranch = () => {
    const branch = localStorage.getItem('selectedBranch');
    return branch ? normalizeBranch(branch) : null;
  };

  const setSelectedCounter = (counterNumber) => {
    if (counterNumber) {
      localStorage.setItem('selectedCounter', counterNumber.toString());
      _setSelectedCounter(counterNumber.toString());
    } else {
      localStorage.removeItem('selectedCounter');
      _setSelectedCounter(null);
    }
  };

  const setSelectedBranch = (branch) => {
    if (branch) {
      const normalizedBranch = normalizeBranch(branch);
      localStorage.setItem('selectedBranch', normalizedBranch);
      _setSelectedBranch(normalizedBranch);
    } else {
      localStorage.removeItem('selectedBranch');
      _setSelectedBranch(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (pb.authStore.isValid && pb.authStore.model?.id) {
        try {
          const record = await pb.collection('users').getOne(pb.authStore.model.id, { $autoCancel: false });
          setCurrentUser(record);
        } catch (err) {
          pb.authStore.clear();
          setCurrentUser(null);
          setSelectedCounter(null);
          setSelectedBranch(null);
        }
      } else {
        pb.authStore.clear();
        setCurrentUser(null);
      }
      setInitialLoading(false);
    };

    initAuth();

    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (!token || !model?.id) {
        setCurrentUser(null);
        setSelectedCounter(null);
        setSelectedBranch(null);
      } else {
        pb.collection('users').getOne(model.id, { $autoCancel: false })
          .then(setCurrentUser)
          .catch(() => {
            pb.authStore.clear();
            setCurrentUser(null);
            setSelectedCounter(null);
            setSelectedBranch(null);
          });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }
      
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      const fullRecord = await pb.collection('users').getOne(authData.record.id, { $autoCancel: false });
      
      setCurrentUser(fullRecord);
      return { success: true, user: fullRecord };
    } catch (error) {
      return { success: false, error: 'Invalid email or password' };
    }
  };

  const logout = () => {
    try {
      pb.authStore.clear();
      setCurrentUser(null);
      setSelectedCounter(null);
      setSelectedBranch(null);
      window.location.assign(getAppPath('/login'));
    } catch (error) {
      // Fail silently
    }
  };

  const isAuthenticated = pb.authStore.isValid && currentUser !== null;
  const isAdmin = currentUser?.role === 'admin';
  const isStaff = ['staff', 'operator'].includes(currentUser?.role);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      logout, 
      isAuthenticated,
      isAdmin,
      isStaff,
      initialLoading,
      selectedBranch,
      setSelectedBranch,
      getSelectedBranch,
      selectedCounter,
      setSelectedCounter,
      getSelectedCounter
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      currentUser: null,
      login: async () => ({ success: false, error: 'Auth context not found' }),
      logout: () => {},
      isAuthenticated: false,
      isAdmin: false,
      isStaff: false,
      initialLoading: false,
      selectedBranch: null,
      setSelectedBranch: () => {},
      getSelectedBranch: () => null,
      selectedCounter: null,
      setSelectedCounter: () => {},
      getSelectedCounter: () => null
    };
  }
  return context;
};
