'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ClientRecord {
  _id: string;
  clientNo: string;
  name: string;
  contactNo: string;
  alternativeNo?: string;
  category: string;
  images: string[];
  handoverImages: string[];
  measurementDrawing: string;
  price: number;
  updatedAt: string;
}

export default function CompletedGallery({ initialSuits }: { initialSuits: ClientRecord[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track active photo index for each suit card
  const [activePhotoIndices, setActivePhotoIndices] = useState<{ [clientNo: string]: number }>({});

  // Lightbox viewer state
  const [activeLightbox, setActiveLightbox] = useState<{
    images: string[];
    clientName: string;
    clientNo: string;
  } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const triggerLightbox = (images: string[], index: number, clientName: string, clientNo: string) => {
    setLightboxIndex(index);
    setActiveLightbox({ images, clientName, clientNo });
  };

  const nextLightboxPhoto = () => {
    if (!activeLightbox) return;
    setLightboxIndex((prev) => (prev + 1) % activeLightbox.images.length);
  };

  const prevLightboxPhoto = () => {
    if (!activeLightbox) return;
    const len = activeLightbox.images.length;
    setLightboxIndex((prev) => (prev - 1 + len) % len);
  };

  const handleNextPhoto = (clientNo: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActivePhotoIndices((prev) => {
      const current = prev[clientNo] || 0;
      return {
        ...prev,
        [clientNo]: (current + 1) % total,
      };
    });
  };

  const handlePrevPhoto = (clientNo: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActivePhotoIndices((prev) => {
      const current = prev[clientNo] || 0;
      return {
        ...prev,
        [clientNo]: (current - 1 + total) % total,
      };
    });
  };

  const filteredSuits = useMemo(() => {
    // Only display suits that have at least one handover photo
    const suitsWithPhotos = initialSuits.filter((suit) => suit.handoverImages && suit.handoverImages.length > 0);
    
    if (!searchQuery.trim()) return suitsWithPhotos;
    const q = searchQuery.toLowerCase().trim();
    return suitsWithPhotos.filter(
      (suit) =>
        suit.name.toLowerCase().includes(q) ||
        suit.clientNo.toLowerCase().includes(q) ||
        suit.category.toLowerCase().includes(q)
    );
  }, [initialSuits, searchQuery]);

  return (
    <div className="space-y-8">
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
          placeholder="Search completed suits by name or code..."
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
          <p className="text-slate-400 font-extrabold text-lg">No completed suits found</p>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Try searching for another client or category.</p>
        </div>
      ) : (
        /* Grid Layout: Photos are the main visual entity */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSuits.map((client) => {
            const totalPhotos = client.handoverImages ? client.handoverImages.length : 0;
            const activeIndex = activePhotoIndices[client.clientNo] || 0;
            const activeImage = client.handoverImages && client.handoverImages.length > 0 ? client.handoverImages[activeIndex] : '';

            return (
              <div
                key={client._id}
                className="bg-white border border-[#E6DFD3] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col group animate-in fade-in duration-200"
              >
                {/* 1. PHOTO BLOCK - Dominates the Card */}
                <div
                  onClick={() => triggerLightbox(client.handoverImages || [], activeIndex, client.name, client.clientNo)}
                  className="relative aspect-[4/5] bg-slate-100 overflow-hidden border-b border-[#E6DFD3]/40 select-none cursor-pointer"
                >
                  <Image
                    src={activeImage}
                    alt={`${client.name} handover photo ${activeIndex + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-102"
                    priority
                  />

                  {/* Top Overlay Badge for Category and Client Code */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
                    <span className="bg-[#1A1A1A]/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/15">
                      {client.category}
                    </span>
                    <span className="bg-[#9E7D3B]/90 backdrop-blur-md text-white text-[10px] font-black tracking-widest px-2.5 py-1 rounded-lg">
                      {client.clientNo}
                    </span>
                  </div>

                  {/* Multi-Photo Carousel Indicators */}
                  {totalPhotos > 1 && (
                    <>
                      {/* Left/Right Slide Arrows */}
                      <button
                        onClick={(e) => handlePrevPhoto(client.clientNo, totalPhotos, e)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#1A1A1A]/60 text-white flex items-center justify-center hover:bg-[#1a1a1a]/85 transition-all shadow-md cursor-pointer z-10 opacity-0 group-hover:opacity-100"
                      >
                        &larr;
                      </button>
                      <button
                        onClick={(e) => handleNextPhoto(client.clientNo, totalPhotos, e)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#1A1A1A]/60 text-white flex items-center justify-center hover:bg-[#1a1a1a]/85 transition-all shadow-md cursor-pointer z-10 opacity-0 group-hover:opacity-100"
                      >
                        &rarr;
                      </button>

                      {/* Photo counter index dot indicators */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1A1A1A]/60 backdrop-blur-md px-2.5 py-1 rounded-full flex gap-1 items-center z-10 border border-white/10">
                        <span className="text-[10px] font-black text-white/90 tracking-wider uppercase">
                          {activeIndex + 1} of {totalPhotos}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* 2. CLIENT DETAILS PANEL - Clean & Minimal */}
                <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 leading-snug group-hover:text-[#9E7D3B] transition-colors">
                        {client.name}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">{client.contactNo}</p>
                    </div>
                    <span className="text-slate-800 font-extrabold text-base">
                      Rs. {client.price !== undefined ? client.price.toLocaleString('en-IN') : '0'}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-3.5 border-t border-slate-50 gap-2">
                    <Link
                      href={`/admin/pending/measurement?code=${encodeURIComponent(client.clientNo)}`}
                      className="px-4 py-2 border border-[#E6DFD3] hover:border-[#9E7D3B] bg-white hover:bg-[#FCFAF5] text-slate-700 hover:text-[#9E7D3B] text-xs font-black rounded-full transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] select-none text-center cursor-pointer tracking-wider"
                    >
                      Measurement
                    </Link>
                    <Link
                      href={`/admin/new?code=${encodeURIComponent(client.clientNo)}`}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-black rounded-full transition-all border border-slate-100 hover:scale-[1.02] active:scale-[0.98] select-none text-center cursor-pointer tracking-wider"
                    >
                      Edit Profile
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
         </div>
      )}

      {/* High-Resolution Lightbox Section */}
      {activeLightbox && (
        <div className="fixed inset-0 bg-[#0A0A0A]/95 z-50 flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white py-2 px-4 border-b border-white/10">
            <div>
              <h4 className="text-lg font-black text-white">{activeLightbox.clientName}</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Client Code: {activeLightbox.clientNo}</p>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setActiveLightbox(null)}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Close Image Viewer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lightbox Image Stage */}
          <div className="relative flex-1 flex items-center justify-center py-8">
            {/* Slide Left Button */}
            {activeLightbox.images.length > 1 && (
              <button
                onClick={prevLightboxPhoto}
                className="absolute left-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10 font-bold text-lg select-none"
              >
                &larr;
              </button>
            )}

            {/* Main Lightbox Image */}
            <div className="relative w-full h-full max-h-[70vh] max-w-4xl select-none">
              <Image
                src={activeLightbox.images[lightboxIndex]}
                alt={`${activeLightbox.clientName} large view`}
                fill
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-contain"
                priority
              />
            </div>

            {/* Slide Right Button */}
            {activeLightbox.images.length > 1 && (
              <button
                onClick={nextLightboxPhoto}
                className="absolute right-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10 font-bold text-lg select-none"
              >
                &rarr;
              </button>
            )}
          </div>

          {/* Lightbox Footer & Thumbnail list */}
          <div className="flex flex-col items-center gap-4 py-2 border-t border-white/10">
            {/* Counter Label */}
            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-black tracking-widest text-white/90 uppercase select-none">
              Photo {lightboxIndex + 1} of {activeLightbox.images.length}
            </span>

            {/* Thumbnails Row */}
            {activeLightbox.images.length > 1 && (
              <div className="flex gap-2 items-center overflow-x-auto max-w-full py-1">
                {activeLightbox.images.map((thumb, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={`relative h-14 w-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      lightboxIndex === idx ? 'border-[#9E7D3B] scale-105' : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={thumb}
                      alt="thumbnail"
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
