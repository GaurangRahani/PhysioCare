import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { clerkAppearance } from '../config/clerkTheme';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      navigate={(to) => navigate(to)}
      afterSignOutUrl="/"
      appearance={clerkAppearance}
    >
      {children}
    </ClerkProvider>
  );
};

export default AuthProvider;
