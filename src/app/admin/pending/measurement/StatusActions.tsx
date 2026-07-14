'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface StatusActionsProps {
  clientNo: string;
  currentStatus: string;
}

export default function StatusActions({ clientNo, currentStatus }: StatusActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/clients/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientNo, status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update suit status');
      }

      setStatus(newStatus);
      setSuccess(`Status updated to "${newStatus}"!`);
      
      // Redirect back to pending suits queue after a brief success delay
      setTimeout(() => {
        router.push('/admin/pending');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error occurred while updating status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#E6DFD3] rounded-3xl p-6 shadow-sm space-y-6">
      <div>
        <h4 className="text-base sm:text-lg font-black text-slate-800 mb-1">Update Suit Status</h4>
        <p className="text-xs sm:text-sm text-slate-500 font-semibold">
          Select where this suit order belongs. Updating will transfer the record to the selected queue.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option 2: Prepared but not handovered */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleUpdateStatus('Prepared but not handovered')}
          className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-200 cursor-pointer select-none ${
            status === 'Prepared but not handovered'
              ? 'bg-[#9E7D3B]/5 border-[#9E7D3B] ring-2 ring-[#9E7D3B]/20'
              : 'bg-[#FCFAF5] border-[#E6DFD3] hover:border-slate-400'
          }`}
        >
          <div className="p-3 bg-amber-100/50 rounded-full mb-3 text-amber-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 11m8 4V11M4 11v10l8 4" />
            </svg>
          </div>
          <span className="text-sm sm:text-base font-black text-slate-800">Prepared but not handovered</span>
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Ready for Delivery</span>
        </button>

        {/* Option 1: Completed and handovered */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleUpdateStatus('Completed and handovered')}
          className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-200 cursor-pointer select-none ${
            status === 'Completed and handovered'
              ? 'bg-[#9E7D3B]/5 border-[#9E7D3B] ring-2 ring-[#9E7D3B]/20'
              : 'bg-[#FCFAF5] border-[#E6DFD3] hover:border-slate-400'
          }`}
        >
          <div className="p-3 bg-emerald-100/50 rounded-full mb-3 text-emerald-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm sm:text-base font-black text-slate-800">Completed and handovered</span>
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Completed & Delivered</span>
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-t border-slate-100 pt-4 select-none">
        <span>Current State: <strong className="text-[#9E7D3B] uppercase tracking-wider">{status}</strong></span>
        {loading && <span className="animate-pulse">Updating status...</span>}
      </div>
    </div>
  );
}
