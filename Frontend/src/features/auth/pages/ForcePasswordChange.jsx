import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ShieldCheck, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';
import Logo from '../../../components/common/Logo';

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

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

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

      // 3. For security, sign out and redirect to login
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error("Update password error", err);
      setError(err.errors?.[0]?.longMessage || err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202223] font-['Inter',system-ui,sans-serif] flex flex-col justify-between relative overflow-hidden">
      
      {/* ── 1. TOP HEADER ────────────────────────────────────────────── */}
      <header className="h-[56px] px-4 sm:px-8 flex items-center justify-between border-b border-[#EAEAEA] bg-[#FFFFFF] z-10">
        <Link to="/" className="cursor-pointer no-underline">
          <Logo size="sm" subtitle="Security" />
        </Link>

        <button
          onClick={() => signOut()}
          className="text-[12px] font-medium text-[#616161] hover:text-[#202223] hover:bg-[#F4F4F4] px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </header>

      {/* ── 2. MAIN CARD ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 relative z-10">
        <div className="w-full max-w-[440px] space-y-4">
          
          <div className="bg-[#FFFFFF] shadow-sm rounded-[16px] border border-[#EAEAEA] p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#F4F4F4] border border-[#EAEAEA] flex items-center justify-center mx-auto text-[#202223]">
                <KeyRound size={20} />
              </div>
              <h1 className="text-[20px] font-bold text-[#202223] tracking-tight">
                Update Initial Password
              </h1>
              <p className="text-[12px] text-[#616161] leading-relaxed">
                You signed in with a temporary staff invitation password. Please set a secure permanent password to activate your access.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {error && (
                <div className="p-3 bg-[#FCE4E4] border border-[#F5C2C2] text-[#B81818] rounded-[10px] text-[12px] flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider block">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3.5 py-2.5 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] focus:bg-[#FFFFFF] focus:border-[#202223] text-[#202223] text-[13px] outline-none shadow-2xs transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] focus:bg-[#FFFFFF] focus:border-[#202223] text-[#202223] text-[13px] outline-none shadow-2xs transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[44px] rounded-[10px] bg-[#000000] hover:bg-[#202020] text-[#FFFFFF] text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:bg-[#F4F4F4] disabled:text-[#A3A3A3] mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Set New Password & Continue</span>
                )}
              </button>
            </form>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8A8A8A]">
            <ShieldCheck size={14} className="text-[#008060]" />
            <span>Encrypted clinical portal · Verified staff authentication</span>
          </div>

        </div>
      </main>

      {/* ── 3. BOTTOM FOOTER ─────────────────────────────────────────── */}
      <footer className="h-[44px] border-t border-[#EAEAEA] bg-[#FFFFFF] px-4 sm:px-8 flex items-center justify-between text-[11px] text-[#8A8A8A] z-10">
        <span>© {new Date().getFullYear()} AlignCare Physical Therapy Systems. All rights reserved.</span>
        <span>Account Security Verification</span>
      </footer>

    </div>
  );
};

export default ForcePasswordChange;
