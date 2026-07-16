import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthRedirect = ({ children }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const verifyAndRedirect = async () => {
      if (!isLoaded) return;
      
      if (!isSignedIn) {
        setIsVerifying(false);
        return;
      }

      // Check for forced password change immediately
      if (user?.publicMetadata?.force_password_change && location.pathname !== '/force-password-change') {
        setIsVerifying(false);
        navigate('/force-password-change', { replace: true });
        return;
      }

      try {
        // PRODUCTION WAY: Read role directly from Clerk token metadata if available!
        // This makes routing INSTANT with zero loading screens.
        const token = await getToken();
        const role = user?.publicMetadata?.role;

        if (role) {
          setIsVerifying(false);

          if (role === 'doctor' && (location.pathname === '/dashboard' || location.pathname === '/dashboard/' || location.pathname === '/receptionist-dashboard')) {
            navigate('/doctor-dashboard', { replace: true });
          } else if (role === 'patient' && (location.pathname === '/doctor-dashboard' || location.pathname === '/doctor-dashboard/' || location.pathname === '/receptionist-dashboard')) {
            navigate('/dashboard', { replace: true });
          } else if (role === 'receptionist' && (location.pathname === '/dashboard' || location.pathname === '/dashboard/' || location.pathname === '/doctor-dashboard' || location.pathname === '/doctor-dashboard/')) {
            navigate('/receptionist-dashboard', { replace: true });
          }
          return;
        }

        // FALLBACK: If publicMetadata is not configured in Clerk Dashboard yet, check the backend
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok && isMounted) {
          const data = await res.json();
          const dbRole = data.user?.role;
          
          setIsVerifying(false);
          
          if (dbRole === 'doctor' && (location.pathname === '/dashboard' || location.pathname === '/dashboard/' || location.pathname === '/receptionist-dashboard')) {
            navigate('/doctor-dashboard', { replace: true });
          } else if (dbRole === 'patient' && (location.pathname === '/doctor-dashboard' || location.pathname === '/doctor-dashboard/' || location.pathname === '/receptionist-dashboard')) {
            navigate('/dashboard', { replace: true });
          } else if (dbRole === 'receptionist' && (location.pathname === '/dashboard' || location.pathname === '/dashboard/' || location.pathname === '/doctor-dashboard' || location.pathname === '/doctor-dashboard/')) {
            navigate('/receptionist-dashboard', { replace: true });
          }
        } else if (isMounted) {
          setIsVerifying(false);
          console.log("Could not fetch user role from backend. Ensure the backend is running and JIT sync is working.");
        }
      } catch (error) {
        console.error("Failed to verify user role:", error);
        if (isMounted) setIsVerifying(false);
      }
    };

    verifyAndRedirect();
    
    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, getToken, navigate, location.pathname]);

  if (isVerifying) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-primary/5">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return children;
};

export default AuthRedirect;
