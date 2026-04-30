import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../services/storage';

interface UserContextType {
  user_role_id: number;
  setUserRoleId: (id: number) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user_role_id, setUser_role_id] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Component mount edildiğinde user_role_id'yi storage'dan yükle
  useEffect(() => {
    const loadUserRoleId = async () => {
      try {
        const userData = await storage.getUserData();
        
        if (userData && userData.user_role_id !== undefined) {
          setUser_role_id(userData.user_role_id);
        } else {
          setUser_role_id(0);
        }
      } catch (error) {
        console.error('❌ UserContext: Error loading user role ID:', error);
        setUser_role_id(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserRoleId();
  }, []);

  const setUserRoleId = async (id: number) => {
    try {
      // State'i güncelle
      setUser_role_id(id);
      
      // User data'yı güncelle (zaten mevcut user data içinde)
      const success = await storage.updateUserData({ user_role_id: id });
    } catch (error) {
    }
  };

  const value: UserContextType = {
    user_role_id,
    setUserRoleId,
    isLoading,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 