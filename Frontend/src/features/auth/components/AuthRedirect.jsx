import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthRedirect = ({ children }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);

  // Safety fallback: Never keep user stuck on loading spinner for more than 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const verifyAndRedirect = async () => {
      if (!isLoaded || !isUserLoaded) return;
      
      if (!isSignedIn) {
        if (isMounted) setIsVerifying(false);
        return;
      }

      // Check for forced password change immediately
      if (user?.publicMetadata?.force_password_change && location.pathname !== '/force-password-change') {
        if (isMounted) setIsVerifying(false);
        navigate('/force-password-change', { replace: true });
        return;
      }

      try {
        const token = await getToken();
        const role = user?.publicMetadata?.role;

        if (role) {
          if (isMounted) setIsVerifying(false);

          if (role === 'admin') {
            if (!location.pathname.startsWith('/admin')) {
              navigate('/admin/dashboard', { replace: true });
            }
            return;
          }

          if (role === 'doctor') {
            if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/receptionist-dashboard')) {
              navigate('/doctor-dashboard', { replace: true });
            }
          } else if (role === 'patient') {
            if (location.pathname.startsWith('/doctor-dashboard') || location.pathname.startsWith('/receptionist-dashboard')) {
              navigate('/dashboard', { replace: true });
            }
          } else if (role === 'receptionist') {
            if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/doctor-dashboard')) {
              navigate('/receptionist-dashboard', { replace: true });
            }
          }
          return;
        }

        // Fallback: If publicMetadata is not set in Clerk, check backend
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok && isMounted) {
          const data = await res.json();
          const dbRole = data.user?.role;
          
          setIsVerifying(false);
          
          if (dbRole === 'admin') {
            if (!location.pathname.startsWith('/admin')) {
              navigate('/admin/dashboard', { replace: true });
            }
          } else if (dbRole === 'doctor') {
            if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/receptionist-dashboard')) {
              navigate('/doctor-dashboard', { replace: true });
            }
          } else if (dbRole === 'patient') {
            if (location.pathname.startsWith('/doctor-dashboard') || location.pathname.startsWith('/receptionist-dashboard')) {
              navigate('/dashboard', { replace: true });
            }
          } else if (dbRole === 'receptionist') {
            if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/doctor-dashboard')) {
              navigate('/receptionist-dashboard', { replace: true });
            }
          }
        } else if (isMounted) {
          setIsVerifying(false);
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
  }, [isLoaded, isUserLoaded, isSignedIn, getToken, navigate, location.pathname, user]);

  if (isVerifying) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFFFFF]"></div>
          <span className="text-[#8A8A8A] text-xs font-mono">Authenticating Workspace...</span>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthRedirect;
