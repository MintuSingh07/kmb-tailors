'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface MeasurementViewerProps {
  clientNo: string;
  clientId: string;
  clientName: string;
  primaryDrawing: string;
  drawings: string[];
}

export default function MeasurementViewer({
  clientNo,
  clientId,
  clientName,
  primaryDrawing,
  drawings,
}: MeasurementViewerProps) {
  const [activePage, setActivePage] = useState(1);

  // Fallback to array containing only primary drawing if drawings list is empty
  const allDrawings = drawings && drawings.length > 0 ? drawings : [primaryDrawing].filter(Boolean);
  const totalPages = allDrawings.length;

  const currentSrc = allDrawings[activePage - 1];

  const handlePrevPage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activePage > 1) {
      setActivePage((prev) => prev - 1);
    }
  };

  const handleNextPage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activePage < totalPages) {
      setActivePage((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Clickable Image Frame */}
      <Link
        href={`/admin/new?id=${encodeURIComponent(clientId)}&draw=true`}
        className="group block relative aspect-[4/3] w-full rounded-3xl bg-white border border-[#E6DFD3] hover:border-[#9E7D3B] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 p-3 select-none"
        title="Click to edit drawing notes"
      >
        {currentSrc ? (
          <Image
            src={currentSrc}
            alt={`${clientName} Measurements Page ${activePage}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 650px"
            className="object-contain transition-transform group-hover:scale-[1.01]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
            <svg className="h-12 w-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <p className="font-black text-sm">No sketch drawing notes saved.</p>
            <span className="text-xs text-slate-400 mt-1 font-semibold">Click to create sketch board</span>
          </div>
        )}
        
        {/* Floating Hover Indicator Badge */}
        <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-white/20 text-white text-[11px] font-black tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
          Click to Edit Sketch
        </div>
      </Link>

      {/* Page Navigation Switcher (Only if there are multiple pages) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center select-none">
          <div className="flex items-center gap-3 bg-slate-200/50 px-2.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={activePage === 1}
              className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Previous Page"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <span className="text-xs font-black text-slate-700 min-w-[70px] text-center">
              Page {activePage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={activePage === totalPages}
              className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Next Page"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
