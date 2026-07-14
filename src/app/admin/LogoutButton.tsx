'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-base font-bold text-slate-700 hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all duration-150 disabled:opacity-50 shadow-sm"
    >
      {loading ? 'Logging out...' : 'Sign Out'}
    </button>
  );
}
