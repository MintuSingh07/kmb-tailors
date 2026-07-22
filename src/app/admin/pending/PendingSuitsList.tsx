'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Ruler } from 'lucide-react';

interface ClientRecord {
  _id: string;
  clientNo: string;
  name: string;
  contactNo: string;
  alternativeNo?: string;
  category: string;
  suitQuantity?: string;
  images: string[];
  handoverImages?: string[];
  suitStatus?: string;
  measurementDrawing: string;
  price: number;
  updatedAt: string;
}

export default function PendingSuitsList({ initialSuits }: { initialSuits: ClientRecord[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuits = useMemo(() => {
    if (!searchQuery.trim()) return initialSuits;
    const q = searchQuery.toLowerCase().trim();
    return initialSuits.filter(
      (suit) =>
        suit.name.toLowerCase().includes(q) ||
        suit.clientNo.toLowerCase().includes(q) ||
        suit.contactNo.includes(q) ||
        (suit.alternativeNo && suit.alternativeNo.includes(q))
    );
  }, [initialSuits, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search suits by customer name or code..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#E6DFD3] bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#9E7D3B] focus:ring-2 focus:ring-[#9E7D3B]/10 font-bold text-sm shadow-sm transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {filteredSuits.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E6DFD3] rounded-3xl p-8 max-w-md mx-auto shadow-sm select-none">
          <p className="text-slate-400 font-extrabold text-lg">No suits match search</p>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Try searching for another customer or code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {filteredSuits.map((client) => {
            return (
              <div
                key={client._id}
                className="bg-white border border-[#E6DFD3] rounded-2xl shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between overflow-hidden group w-full max-w-sm mx-auto"
              >
                {/* Clickable Card Header & Body */}
                <Link
                  href={`/admin/new?id=${client._id}`}
                  className="flex-1 flex flex-col cursor-pointer"
                  title="Click card to edit profile details"
                >
                  {/* Card Body */}

              {/* Card Body */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-black text-slate-800 truncate leading-snug group-hover:text-[#9E7D3B] transition-colors">
                      {client.name}
                    </h2>
                    <span className="inline-block text-[#9E7D3B] bg-[#9E7D3B]/10 border border-[#E6DFD3] rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider mt-1 select-none">
                      {client.category}
                    </span>
                    {client.suitQuantity && (
                      <span className="inline-block text-slate-700 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider mt-1 ml-1.5 select-none">
                        Qty: {client.suitQuantity}
                      </span>
                    )}
                  </div>
                  <span className="text-[#9E7D3B] bg-[#FCFAF5] border border-[#E6DFD3] rounded-lg px-2 py-0.5 text-[10px] font-black tracking-wider select-none shrink-0">
                    {client.clientNo}
                  </span>
                </div>

                {/* Contact Number & Price */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600 text-xs sm:text-sm">
                      <svg className="h-4 w-4 text-[#9E7D3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-bold">
                        {client.contactNo}
                      </span>
                    </div>
                    <span className="text-slate-800 font-extrabold text-xs sm:text-sm">
                      Rs. {client.price !== undefined ? client.price.toLocaleString('en-IN') : '8,500'}
                    </span>
                  </div>
                  {client.alternativeNo && (
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <span className="w-4 text-center font-bold text-[#9E7D3B] text-[9px] uppercase">Alt</span>
                      <span className="font-semibold">
                        {client.alternativeNo}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Card Footer */}
            <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50/50">
              {client.suitStatus !== 'Prepared but not handovered' && client.suitStatus !== 'Completed and handovered' ? (
                <Link
                  href={`/admin/pending/measurement?id=${client._id}`}
                  className="px-3.5 py-1.5 border border-[#E6DFD3] hover:border-[#9E7D3B] bg-white hover:bg-[#FCFAF5] text-slate-700 hover:text-[#9E7D3B] text-[10px] font-black rounded-full transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] select-none text-center cursor-pointer inline-flex items-center justify-center gap-1.5 tracking-wider"
                >
                  <Ruler className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  Measurement
                </Link>
              ) : <div />}
              
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider select-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Click card to edit &rarr;
              </span>
            </div>
          </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
