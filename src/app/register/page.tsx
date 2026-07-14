'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#FDFCF7] to-[#F5F1E6] px-4 py-12 sm:px-6 lg:px-8 text-[#1A1A1A] font-sans">
      {/* Background Subtle Glows */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#E8DCC4]/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 translate-x-1/2 rounded-full bg-[#DFD3C3]/30 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md">
        {/* Registration Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-10 shadow-xl shadow-slate-200/50">
          <div className="text-center mb-8 flex flex-col items-center">
            {/* Logo */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-4 select-none">
              <Image
                src="/logo.png"
                alt="KMB Tailor Logo"
                fill
                sizes="(max-width: 640px) 96px, 112px"
                priority
                className="object-contain"
              />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A]">
              Create Account
            </h2>
            <p className="mt-2 text-base sm:text-lg text-slate-500">
              Join KMB Tailor to access your admin panel
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-base text-red-600 animate-pulse font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-base text-emerald-600 font-medium">
                Registration successful! Redirecting to login...
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-base sm:text-lg font-semibold text-slate-700 mb-1">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  disabled={loading || success}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[#1A1A1A] placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A85C]/20 transition-all duration-200 disabled:opacity-50 text-base sm:text-lg"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-base sm:text-lg font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={loading || success}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[#1A1A1A] placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A85C]/20 transition-all duration-200 disabled:opacity-50 text-base sm:text-lg"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-base sm:text-lg font-semibold text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  disabled={loading || success}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[#1A1A1A] placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A85C]/20 transition-all duration-200 disabled:opacity-50 text-base sm:text-lg"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || success}
                className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-[#DFBA6B] to-[#9E7D3B] hover:from-[#E3C277] hover:to-[#A78542] px-4 py-3.5 text-base sm:text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#C5A85C]/50 transition-all duration-200 shadow-md shadow-[#9E7D3B]/10 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-base sm:text-lg">
            <span className="text-slate-500">Already have an account? </span>
            <Link href="/login" className="font-bold text-[#9E7D3B] hover:text-[#A78542] transition-colors duration-150">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
