'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Ruler } from 'lucide-react';
import { getOptimizedImageUrl } from '../../../lib/imageUtils';

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
  
  // Interactive selected client modal state for instant client-side gallery view (works 100% offline & in production)
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);

  // Fullscreen photo zoom viewer state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanningImage, setIsPanningImage] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

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

  // Pointer panning logic for zoomed images
  const handleImagePointerDown = (e: React.PointerEvent) => {
    if (zoomScale <= 1) return;
    setIsPanningImage(true);
    setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleImagePointerMove = (e: React.PointerEvent) => {
    if (!isPanningImage || zoomScale <= 1) return;
    setPanPosition({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleImagePointerUp = () => {
    setIsPanningImage(false);
  };

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
            ];

            const allImages = [...handoverImgs, ...fabricImgs];
            const totalCount = allImages.length;

            return (
              <div
                key={client._id}
                className="bg-white border border-[#E6DFD3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col group animate-in fade-in duration-200 w-full"
              >
                {/* 1. PHOTO BLOCK — Clicking opens gallery modal in-place without page refresh */}
                <div
                  onClick={() => setSelectedClient(client)}
                  className="flex border-b border-[#E6DFD3]/40 overflow-hidden select-none gap-px bg-[#F5F0E8] min-h-72 sm:min-h-[22rem] md:min-h-[26rem] cursor-pointer relative group/photo"
                >
                  {[0, 1, 2].map((idx) => {
                    const imgSrc = displayImages[idx] || null;

                    return (
                      <div
                        key={idx}
                        className="relative flex-1 bg-[#F5F0E8] overflow-hidden"
                      >
                        {imgSrc ? (
                          <img
                            src={getOptimizedImageUrl(imgSrc, 600)}
                            alt={`${client.name} photo ${idx + 1}`}
                            loading={idx === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                            onError={(e) => {
                              if (imgSrc) e.currentTarget.src = imgSrc;
                            }}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover/photo:scale-[1.03]"
                          />
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
                  {/* Hover Overlay Prompt */}
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                    <span className="bg-white/95 text-slate-900 text-xs font-black tracking-wider uppercase px-4 py-2 rounded-full shadow-lg">
                      Open Gallery &rarr;
                    </span>
                  </div>
                </div>

                {/* 2. CLIENT DETAILS PANEL */}
                <div className="p-4.5 flex flex-col justify-between flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 
                        onClick={() => setSelectedClient(client)}
                        className="text-base font-black text-slate-800 leading-snug group-hover:text-[#9E7D3B] transition-colors cursor-pointer"
                      >
                        {client.name}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">{client.contactNo}</p>
                    </div>
                    <span className="text-slate-800 font-extrabold text-sm">
                      Rs. {client.price !== undefined ? client.price.toLocaleString('en-IN') : '0'}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50 gap-2">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="px-3.5 py-1.5 bg-[#9E7D3B]/10 text-[#9E7D3B] hover:bg-[#9E7D3B] hover:text-white text-[10px] font-black rounded-full transition-all border border-[#9E7D3B]/20 hover:scale-[1.02] active:scale-[0.98] select-none text-center cursor-pointer tracking-wider flex items-center gap-1.5"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="18" x="3" y="3" rx="2"/>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        <circle cx="9" cy="9" r="2"/>
                      </svg>
                      View Gallery
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/new?id=${client._id}&draw=true`}
                        className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 rounded-full text-[10px] font-black tracking-wider transition-all flex items-center gap-1 hover:scale-105 active:scale-95 cursor-pointer"
                        title="View & Edit Measurement Whiteboard"
                      >
                        <Ruler className="h-3 w-3" />
                        Measurement
                      </Link>

                      <Link
                        href={`/admin/new?id=${client._id}`}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black rounded-full transition-all border border-slate-200 hover:scale-[1.02] active:scale-[0.98] select-none text-center cursor-pointer tracking-wider"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CLIENT GALLERY MODAL — Opens gallery instantly in-place without page refresh */}
      {selectedClient && (
        <div
          onClick={() => setSelectedClient(null)}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#E6DFD3] rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden select-none"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 bg-[#FAF7F2] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black text-slate-800">{selectedClient.name}</h2>
                  <span className="px-2.5 py-0.5 bg-[#9E7D3B]/10 text-[#9E7D3B] border border-[#9E7D3B]/20 text-xs font-black rounded-full">
                    {selectedClient.clientNo}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  {selectedClient.contactNo} • Category: {selectedClient.category || 'General'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/new?id=${selectedClient._id}&draw=true`}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black tracking-wider transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95"
                >
                  <Ruler className="h-4 w-4" />
                  Edit Measurement
                </Link>

                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Close Gallery"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content — Photo Grid */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Handover Outfit Photos Section */}
              {selectedClient.handoverImages && selectedClient.handoverImages.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                    Completed Outfit Handover Photos ({selectedClient.handoverImages.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedClient.handoverImages.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImage(imgSrc)}
                        className="relative aspect-3/4 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-zoom-in group/item shadow-xs hover:shadow-md hover:scale-[1.02] transition-all"
                      >
                        <img
                          src={getOptimizedImageUrl(imgSrc, 600)}
                          alt={`Handover Photo ${idx + 1}`}
                          loading="lazy"
                          onError={(e) => {
                            if (imgSrc) e.currentTarget.src = imgSrc;
                          }}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/60 px-2.5 py-1 rounded-full">Zoom</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fabric Design Photos Section */}
              {selectedClient.images && selectedClient.images.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                    Fabric & Sample Photos ({selectedClient.images.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedClient.images.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImage(imgSrc)}
                        className="relative aspect-3/4 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-zoom-in group/item shadow-xs hover:shadow-md hover:scale-[1.02] transition-all"
                      >
                        <img
                          src={getOptimizedImageUrl(imgSrc, 600)}
                          alt={`Fabric Photo ${idx + 1}`}
                          loading="lazy"
                          onError={(e) => {
                            if (imgSrc) e.currentTarget.src = imgSrc;
                          }}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/60 px-2.5 py-1 rounded-full">Zoom</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-[#FAF7F2] flex items-center justify-between">
              <Link
                href={`/admin/gallery/${selectedClient._id}`}
                className="text-xs font-extrabold text-[#9E7D3B] hover:underline flex items-center gap-1"
              >
                Open Full Gallery Page &rarr;
              </Link>
              <button
                onClick={() => setSelectedClient(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black rounded-xl transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PHOTO LIGHTBOX MODAL — Zoom and Pan */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-[#0A0A0A]/95 z-60 flex items-center justify-center p-4 sm:p-6 cursor-zoom-out animate-in fade-in duration-200"
        >
          {/* Zoom Control Bar */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full z-50 select-none shadow-xl"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoomScale((prev) => Math.max(1, prev - 0.5));
                if (zoomScale <= 1.5) setPanPosition({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors cursor-pointer disabled:opacity-40"
              disabled={zoomScale <= 1}
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
              </svg>
            </button>
            <span className="text-white text-xs font-black min-w-10 text-center tracking-wider font-mono">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoomScale((prev) => Math.min(4, prev + 0.5));
              }}
              className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors cursor-pointer disabled:opacity-40"
              disabled={zoomScale >= 4}
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
              </svg>
            </button>
            {zoomScale > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors cursor-pointer border-l border-white/20 pl-2.5 ml-1"
              >
                <span className="text-[9px] font-black tracking-widest uppercase">Reset</span>
              </button>
            )}
          </div>

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

          {/* Full Screen Image Canvas Wrapper */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full h-full max-w-5xl max-h-[85vh] select-none flex items-center justify-center overflow-hidden"
          >
            <div 
              onPointerDown={handleImagePointerDown}
              onPointerMove={handleImagePointerMove}
              onPointerUp={handleImagePointerUp}
              className="relative w-full h-full select-none transition-transform duration-100 ease-out origin-center"
              style={{ 
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
                cursor: zoomScale > 1 ? (isPanningImage ? 'grabbing' : 'grab') : 'default'
              }}
            >
              <img
                src={selectedImage}
                alt="Fullscreen View"
                onError={(e) => {
                  if (selectedImage) {
                    e.currentTarget.src = getOptimizedImageUrl(selectedImage, 600);
                  }
                }}
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
