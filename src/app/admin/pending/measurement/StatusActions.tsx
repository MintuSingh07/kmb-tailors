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
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/clients/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientNo, status: newStatus, images }),
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
          onClick={() => setSelectedStatus('Prepared but not handovered')}
          className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-200 cursor-pointer select-none ${
            selectedStatus === 'Prepared but not handovered'
              ? 'bg-[#9E7D3B]/5 border-[#9E7D3B] ring-2 ring-[#9E7D3B]/20'
              : 'bg-[#FCFAF5] border-[#E6DFD3] hover:border-slate-400'
          }`}
        >
          <div className="p-3 bg-amber-100/50 rounded-full mb-3 text-amber-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
          <span className="text-sm sm:text-base font-black text-slate-800">Prepared but not handovered</span>
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Ready for Delivery</span>
        </button>

        {/* Option 1: Completed and handovered */}
        <button
          type="button"
          disabled={loading}
          onClick={() => setSelectedStatus('Completed and handovered')}
          className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-200 cursor-pointer select-none ${
            selectedStatus === 'Completed and handovered'
              ? 'bg-[#9E7D3B]/5 border-[#9E7D3B] ring-2 ring-[#9E7D3B]/20'
              : 'bg-[#FCFAF5] border-[#E6DFD3] hover:border-slate-400'
          }`}
        >
          <div className="p-3 bg-emerald-100/50 rounded-full mb-3 text-emerald-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <span className="text-sm sm:text-base font-black text-slate-800">Completed and handovered</span>
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Completed & Delivered</span>
        </button>
      </div>

      {selectedStatus !== status && (
        <div className="border-t border-[#E6DFD3]/60 pt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          {selectedStatus === 'Completed and handovered' && (
            <div className="space-y-3">
              <label className="block text-sm sm:text-base font-bold text-slate-700">
                Add Handover Photos (Optional)
              </label>
              <p className="text-xs text-slate-400 font-semibold mb-2">
                Snap or upload photos of the completed suit before giving it to the client.
              </p>
              
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  id="handover-image-file"
                  className="hidden"
                />
                <label
                  htmlFor="handover-image-file"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-[#E6DFD3] hover:border-[#C5A85C] bg-white rounded-2xl p-6 cursor-pointer shadow-sm transition-all duration-200"
                >
                  <svg className="h-8 w-8 text-[#9E7D3B] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  <span className="text-sm font-bold text-slate-700">Add Photos</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Select from library or tap camera</span>
                </label>
              </div>

              {/* Previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {images.map((imgData, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group shadow-sm bg-slate-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgData}
                        alt={`Preview ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/95 transition-colors focus:outline-none cursor-pointer"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleUpdateStatus(selectedStatus)}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-[#DFBA6B] to-[#9E7D3B] hover:from-[#E3C277] hover:to-[#A78542] rounded-xl text-white font-extrabold text-sm sm:text-base shadow-md shadow-[#9E7D3B]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center font-black"
            >
              {loading ? 'Updating...' : `Confirm Update`}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setSelectedStatus(status);
                setImages([]);
              }}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm sm:text-base border border-slate-200 transition-all cursor-pointer text-center font-black"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-t border-slate-100 pt-4 select-none">
        <span>Current State: <strong className="text-[#9E7D3B] uppercase tracking-wider">{status}</strong></span>
        {loading && <span className="animate-pulse">Updating status...</span>}
      </div>
    </div>
  );
}
