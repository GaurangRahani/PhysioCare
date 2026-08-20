import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ShieldAlert, Activity } from 'lucide-react';
import './ForcePasswordChange.css';

const ForcePasswordChange = () => {
  const { isLoaded, user } = useUser();
  const { getToken, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!isLoaded || !user) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Update the password in Clerk
      await user.updatePassword({
        newPassword: password,
      });

      // 2. Clear the force_password_change flag on the backend
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/clear-password-flag`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error("Failed to clear security flag.");
      }

      // 3. For production security, log the user out after a forced password change
      await signOut();

      // 4. Redirect to login screen
      navigate('/login');
    } catch (err) {
      console.error("Update password error", err);
      setError(err.errors?.[0]?.longMessage || err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fpc-page-wrapper">
      
      {/* Floating Animated Shapes */}
      <div className="fpc-shape fpc-shape-1"></div>
      <div className="fpc-shape fpc-shape-2"></div>

      <div className="fpc-content-container">
        
        {/* Logo Header */}
        <Link to="/" className="fpc-logo-header">
          <div className="fpc-logo-icon">
            <Activity className="h-8 w-8" />
          </div>
          <span className="fpc-logo-text">PhysioCare</span>
        </Link>

        {/* Card */}
        <div className="fpc-card">
          <div className="fpc-card-header">
            <div className="fpc-alert-icon">
              <ShieldAlert size={30} />
            </div>
            <h2 className="fpc-card-title">Security Update</h2>
            <p className="fpc-card-subtitle">
              You logged in with a temporary password. Please set a new secure password to continue.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="fpc-form">
            {error && (
              <div className="fpc-error-box">
                <ShieldAlert size={18} />
                {error}
              </div>
            )}

            <div className="fpc-form-group">
              <label className="fpc-label">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="fpc-input"
                placeholder="••••••••"
              />
            </div>

            <div className="fpc-form-group">
              <label className="fpc-label">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="fpc-input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="fpc-submit-btn"
            >
              {loading ? <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} /> : 'Set New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
