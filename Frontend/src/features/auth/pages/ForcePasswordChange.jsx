import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-primary/5">
      <div className="bg-white shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] rounded-[12px] border border-gray-100 p-8 w-full max-w-md">
        
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="bg-orange-100 p-3 rounded-full mb-3 text-orange-600">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-2xl font-bold text-dark tracking-tight">Security Update</h2>
          <p className="text-gray-500 mt-2 text-sm">
            You logged in with a temporary password. Please set a new secure password to continue.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-danger bg-red-50 border border-red-100 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-[#7074e8] hover:opacity-90 transition-all text-white font-bold rounded-lg shadow-md mt-4 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
