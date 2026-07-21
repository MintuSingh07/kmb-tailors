'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface GalleryViewProps {
  clientName: string;
  clientNo: string;
  images: string[];
  handoverImages: string[];
  username: string;
}

export default function GalleryView({
  clientName,
  clientNo,
  images,
  handoverImages,
  username,
}: GalleryViewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Combine both handover and style images for the grid
  const allImages = [...(handoverImages || []), ...(images || [])];

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-[#1A1A1A] font-sans pb-24 overflow-x-hidden">
      {/* Background Subtle Glows */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-[#E8DCC4]/20 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 translate-x-1/2 rounded-full bg-[#DFD3C3]/35 blur-[150px] pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 select-none">
            <Image
              src="/logo.png"
              alt="KMB Boutique Logo"
              fill
              sizes="(max-width: 640px) 40px, 48px"
              priority
              className="object-contain"
            />
          </div>
          <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-[#1A1A1A]">
            KMB Boutique{' '}
            <span className="hidden min-[450px]:inline-block font-semibold text-slate-500 text-sm sm:text-lg ml-1.5 border-l border-slate-200 pl-2.5">
              Client Gallery
            </span>
          </span>
        </div>
        <div className="flex items-center gap-4 select-none">
          <span className="text-base sm:text-lg text-slate-500 hidden sm:inline">
            Logged as, <strong className="text-[#9E7D3B] capitalize font-bold">{username}</strong>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Back Button & Count */}
        <div className="flex items-center justify-between mb-8 select-none">
          <Link
            href="/admin/completed"
            className="flex items-center gap-2 text-slate-500 hover:text-[#9E7D3B] text-base sm:text-lg font-semibold transition-colors duration-150"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Completed Gallery
          </Link>
          <span className="bg-[#9E7D3B]/10 text-[#9E7D3B] border border-[#E6DFD3] px-3.5 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider">
            {allImages.length} {allImages.length === 1 ? 'Photo' : 'Photos'}
          </span>
        </div>

        {/* Title */}
        <div className="mb-8 select-none border-b border-[#E6DFD3]/40 pb-6">
          <span className="text-[10px] font-black text-[#9E7D3B] uppercase tracking-widest block mb-1">
            Customer Profile Photos
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800">
            {clientName}
          </h1>
          <span className="inline-block mt-2 text-xs sm:text-sm font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
            Client Code: <strong className="text-[#9E7D3B] font-black ml-1">{clientNo}</strong>
          </span>
        </div>

        {/* Dynamic Gallery Grid (3 Images Side by Side on desktop) */}
        {allImages.length === 0 ? (
          <div className="rounded-3xl border border-[#E6DFD3] bg-[#FCFAF5] p-12 text-center shadow-xl shadow-slate-200/30 flex flex-col items-center justify-center max-w-2xl mx-auto select-none">
            <div className="p-5 bg-white rounded-full border border-slate-200/60 shadow-sm mb-4">
              <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                <circle cx="9" cy="9" r="2" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">No Photos Saved</h2>
            <p className="text-slate-500 font-semibold">This client has no design or handover photos loaded.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {allImages.map((imgSrc, index) => {
              const isHandover = index < (handoverImages?.length || 0);

              return (
                <div
                  key={index}
                  onClick={() => setSelectedImage(imgSrc)}
                  className="group relative bg-[#FCFAF5] border border-[#E6DFD3] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer flex flex-col aspect-[4/5] min-h-[300px]"
                >
                  <div className="relative flex-1 w-full h-full overflow-hidden select-none">
                    <Image
                      src={imgSrc}
                      alt={`${clientName} photo ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    
                    {/* Badge type label (Handover vs Style) */}
                    <span className={`absolute top-4 left-4 border text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm select-none ${
                      isHandover 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-amber-50 border-amber-200 text-[#9E7D3B]'
                    }`}>
                      {isHandover ? 'Handover' : 'Design Fabric'}
                    </span>

                    {/* View Fullscreen Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="bg-white/95 text-slate-800 border border-[#E6DFD3] text-xs font-black tracking-wider uppercase px-4.5 py-2.5 rounded-full shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 select-none">
                        View Fullscreen &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Full-Screen Lightbox Modal Overlay */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-[#0A0A0A]/95 z-50 flex items-center justify-center p-4 sm:p-6 cursor-zoom-out animate-in fade-in duration-200"
        >
          {/* Close Button top-right */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer z-50"
            title="Close Fullscreen View"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Full Screen Image */}
          <div className="relative w-full h-full max-w-5xl max-h-[85vh] select-none flex items-center justify-center">
            <Image
              src={selectedImage}
              alt="Fullscreen View"
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
