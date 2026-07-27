'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getOptimizedImageUrl } from '../../../lib/imageUtils';
import { sharePhotoOnWhatsApp } from '../../../lib/whatsappShare';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredSuits.map((client) => {
            const handoverImgs = client.handoverImages || [];
            const fabricImgs   = client.images || [];

            // Priority: handover first, fill remaining slots with fabric, cap at 3
            const slotsLeft    = Math.max(0, 3 - handoverImgs.length);
            const displayImages = [
              ...handoverImgs.slice(0, 3),
              ...fabricImgs.slice(0, slotsLeft),
            ]; // already max 3 items

            // Full ordered list for the lightbox (handover + fabric)
            const allImages = [...handoverImgs, ...fabricImgs];
            const totalCount = allImages.length;

            return (
              <div
                key={client._id}
                className="bg-white border border-[#E6DFD3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col group animate-in fade-in duration-200 w-full"
              >
                {/* 1. PHOTO BLOCK — 3 full-portrait images side by side, no cropping */}
                <Link
                  href={`/admin/gallery/${client._id}`}
                  className="flex border-b border-[#E6DFD3]/40 overflow-hidden select-none gap-px bg-[#F5F0E8] min-h-72 sm:min-h-[22rem] md:min-h-[26rem] cursor-pointer block"
                >
                  {[0, 1, 2].map((idx) => {
                    const imgSrc  = displayImages[idx] || null;

                    return (
                      <div
                        key={idx}
                        className="relative flex-1 bg-[#F5F0E8] overflow-hidden"
                      >
                        {imgSrc ? (
                          <>
                            <Image
                              src={getOptimizedImageUrl(imgSrc, 600)}
                              alt={`${client.name} photo ${idx + 1}`}
                              fill
                              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 17vw, 11vw"
                              className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                              priority={idx === 0}
                            />
                            <button
                              type="button"
                              title="Share photo on WhatsApp"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                sharePhotoOnWhatsApp({
                                  imageUrl: imgSrc,
                                  phoneNo: client.contactNo || client.alternativeNo,
                                  clientName: client.name,
                                  title: `${client.category || 'Order'} Photo ${idx + 1}`,
                                });
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md z-20 transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 hover:opacity-100"
                            >
                              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#F5F0E8]">
                            <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <rect width="18" height="18" x="3" y="3" rx="2"/>
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                              <circle cx="9" cy="9" r="2"/>
                            </svg>
                          </div>
                        )}
                        {/* "+N more" overlay on 3rd slot when there are extra images */}
                        {idx === 2 && totalCount > 3 && (
                          <div className="absolute inset-0 bg-[#1A1A1A]/55 flex items-center justify-center">
                            <span className="text-white text-sm font-black tracking-wide">+{totalCount - 3} more</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Link>

                {/* 2. CLIENT DETAILS PANEL - Clean & Minimal */}
                <div className="p-4.5 flex flex-col justify-between flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-800 leading-snug group-hover:text-[#9E7D3B] transition-colors">
                        {client.name}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">{client.contactNo}</p>
                    </div>
                    <span className="text-slate-800 font-extrabold text-sm">
                      Rs. {client.price !== undefined ? client.price.toLocaleString('en-IN') : '0'}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-end pt-3 border-t border-slate-50 gap-2">
                    <Link
                      href={`/admin/new?id=${client._id}`}
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black rounded-full transition-all border border-slate-100 hover:scale-[1.02] active:scale-[0.98] select-none text-center cursor-pointer tracking-wider"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
         </div>
      )}
    </div>
  );
}
