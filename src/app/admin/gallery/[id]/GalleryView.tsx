'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Ruler } from 'lucide-react';
import { getOptimizedImageUrl } from '../../../../lib/imageUtils';
import { sharePhotoOnWhatsApp } from '../../../../lib/whatsappShare';

interface GalleryViewProps {
  clientId: string;
  clientName: string;
  clientNo: string;
  contactNo?: string;
  alternativeNo?: string;
  images: string[];
  handoverImages: string[];
  username: string;
}

export default function GalleryView({
  clientId,
  clientName,
  clientNo,
  contactNo,
  alternativeNo,
  images,
  handoverImages,
  username,
}: GalleryViewProps) {
  const [localImages, setLocalImages] = useState<string[]>(images || []);
  const [localHandoverImages, setLocalHandoverImages] = useState<string[]>(handoverImages || []);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Zoom and panning states for fullscreen viewer
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanningImage, setIsPanningImage] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Helper function to compress large camera photos client-side before sending to server
  const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new (window.Image || HTMLImageElement)();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(event.target?.result as string);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Combine both handover and style images for the grid
  const allImages = [...localHandoverImages, ...localImages];

  // Organize images into 3-slot rows from newest to oldest.
  // The newest image is always placed at the very first slot (index 0, top-left).
  // Unfilled top rows retain empty space slots, allowing subsequent uploads to fill remaining slots.
  const gridRows = useMemo(() => {
    if (!allImages || allImages.length === 0) return [];

    const rows: (string | null)[][] = [];
    const chunkSize = 3;

    for (let i = 0; i < allImages.length; i += chunkSize) {
      const chunk: (string | null)[] = allImages.slice(i, i + chunkSize);
      while (chunk.length < chunkSize) {
        chunk.push(null);
      }
      rows.push(chunk);
    }

    return rows;
  }, [allImages]);

  // Handle uploading photos from device storage or camera capture
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);

    try {
      const base64Promises = Array.from(files).map((file) => compressImage(file));
      const base64Images = await Promise.all(base64Promises);
      
      let lastUpdatedClient: any = null;
      let uploadErrorMsg: string | null = null;

      // Upload each photo one by one to keep request payload size under Vercel limits (< 500KB)
      for (const base64Img of base64Images) {
        const res = await fetch(`/api/clients/${clientId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newImages: [base64Img] }),
        });

        if (res.ok) {
          const data = await res.json();
          lastUpdatedClient = data.client;
        } else {
          const errData = await res.json().catch(() => ({}));
          uploadErrorMsg = errData.error || 'Failed to upload photo';
          break;
        }
      }

      if (lastUpdatedClient) {
        setLocalHandoverImages(lastUpdatedClient.handoverImages || []);
        setLocalImages(lastUpdatedClient.images || []);
      }

      if (uploadErrorMsg) {
        alert(uploadErrorMsg);
      }
    } catch (err: any) {
      console.error('Error uploading photos:', err);
      alert('An error occurred during photo upload: ' + (err.message || err));
    } finally {
      setLoading(false);
      // Reset input element value so same photo can be re-captured/selected
      e.target.value = '';
    }
  };

  // Handle deleting a photo from the gallery lists
  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this photo from the gallery?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setLocalHandoverImages(data.client.handoverImages || []);
        setLocalImages(data.client.images || []);
      } else {
        alert('Failed to delete the photo.');
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('An error occurred while deleting the photo.');
    } finally {
      setLoading(false);
    }
  };

  // Stylus, touch and mouse panning event handlers for zoomed image
  const handleImagePointerDown = (e: React.PointerEvent) => {
    if (zoomScale <= 1) return;
    setIsPanningImage(true);
    setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleImagePointerMove = (e: React.PointerEvent) => {
    if (!isPanningImage) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    setPanPosition({ x: dx, y: dy });
  };

  const handleImagePointerUp = (e: React.PointerEvent) => {
    setIsPanningImage(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-[#1A1A1A] font-sans pb-24 overflow-x-hidden">
      {/* Background Subtle Glows */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-[#E8DCC4]/20 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 translate-x-1/2 rounded-full bg-[#DFD3C3]/35 blur-[150px] pointer-events-none"></div>

      {/* Loading Overlay Spinner */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center select-none">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-[#9E7D3B]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-black tracking-wider text-slate-700 uppercase">Updating Gallery...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 select-none">
            <Image
              src="/logo.png"
              alt="KBM Boutique Logo"
              fill
              sizes="(max-width: 640px) 40px, 48px"
              priority
              className="object-contain"
            />
          </div>
          <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-[#1A1A1A]">
            KBM Boutique{' '}
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
        {/* Back Button */}
        <div className="flex items-center mb-8 select-none">
          <Link
            href="/admin/photos"
            className="flex items-center gap-2 text-slate-500 hover:text-[#9E7D3B] text-base sm:text-lg font-semibold transition-colors duration-150"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Handover Catalog
          </Link>
        </div>

        {/* Client Name & Code Display Header */}
        <div className="mb-6 select-none flex flex-wrap items-center gap-3 sm:gap-4 border-b border-[#E6DFD3]/40 pb-5">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800">
            {clientName}
          </h1>
          <span className="text-xs sm:text-sm font-black tracking-wider uppercase bg-[#9E7D3B]/10 text-[#9E7D3B] border border-[#E6DFD3] px-3.5 py-1.5 rounded-2xl select-none">
            Code: {clientNo}
          </span>
        </div>

        {/* Add/Take Photos Buttons */}
        <div className="flex items-center gap-3 mb-8 select-none flex-wrap">
          <button
            onClick={() => document.getElementById('gallery-file-upload')?.click()}
            className="px-5 py-2.5 bg-[#9E7D3B] hover:bg-[#C5A85C] text-white text-xs sm:text-sm font-black rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add from Gallery
          </button>

          <button
            onClick={() => document.getElementById('gallery-camera-capture')?.click()}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Take Photo
          </button>

          <Link
            href={`/admin/new?id=${clientId}&draw=true`}
            className="px-5 py-2.5 bg-white border border-[#E6DFD3] hover:border-[#9E7D3B] hover:bg-[#9E7D3B]/5 text-slate-700 hover:text-[#9E7D3B] text-xs sm:text-sm font-black rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Ruler className="h-4.5 w-4.5 text-[#9E7D3B]" strokeWidth={2.5} />
            Measurement
          </Link>

          <input
            type="file"
            id="gallery-file-upload"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          <input
            type="file"
            id="gallery-camera-capture"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />
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
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
            {gridRows.flatMap((row, rIdx) =>
              row.map((imgSrc, cIdx) => {
                if (!imgSrc) return <div key={`empty-${rIdx}-${cIdx}`} className="w-full aspect-[3/4]" />;

                return (
                  <div
                    key={`img-${rIdx}-${cIdx}`}
                    onClick={() => {
                      setSelectedImage(imgSrc);
                      setZoomScale(1);
                      setPanPosition({ x: 0, y: 0 });
                    }}
                    className="group relative bg-white border border-slate-100 rounded-md sm:rounded-lg overflow-hidden shadow-xs hover:shadow-sm cursor-pointer flex flex-col w-full aspect-[3/4] select-none transition-all duration-200"
                  >
                    <img
                      src={getOptimizedImageUrl(imgSrc, 600)}
                      alt={`${clientName} photo ${rIdx * 3 + cIdx + 1}`}
                      loading={rIdx < 3 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="w-full h-full object-cover block transition-transform duration-350 group-hover:scale-105"
                    />

                    {/* Overlay Action Buttons */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-1.5 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sharePhotoOnWhatsApp({
                            imageUrl: imgSrc,
                            phoneNo: contactNo || alternativeNo,
                            clientName: clientName,
                            title: `Client ${clientNo} Photo`,
                          });
                        }}
                        className="p-1.5 sm:p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all shadow-md hover:scale-110 active:scale-95 cursor-pointer"
                        title="Share on WhatsApp"
                      >
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(imgSrc);
                        }}
                        className="p-1.5 sm:p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 duration-200"
                        title="Delete Photo"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* View Fullscreen Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="bg-white/95 text-slate-800 border border-slate-200 text-[10px] sm:text-xs font-black tracking-wider uppercase px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 select-none">
                        View Fullscreen &rarr;
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Full-Screen Lightbox Modal Overlay */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-[#0A0A0A]/95 z-50 flex items-center justify-center p-4 sm:p-6 cursor-zoom-out animate-in fade-in duration-200"
        >
          {/* Zoom Control Bar (top center) */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full z-50 select-none shadow-xl"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoomScale((prev) => Math.max(1, prev - 0.5));
                if (zoomScale <= 1.5) setPanPosition({ x: 0, y: 0 }); // reset pan if zooming back to 1x
              }}
              className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Zoom Out"
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
              className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Zoom In"
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
                title="Reset Zoom"
              >
                <span className="text-[9px] font-black tracking-widest uppercase">Reset</span>
              </button>
            )}
          </div>

          {/* Delete Button top-left */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteImage(selectedImage);
              setSelectedImage(null);
            }}
            className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer z-50 transition-all uppercase tracking-wider select-none hover:scale-105 active:scale-95"
            title="Delete This Photo"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Photo
          </button>

          {/* Top-right action controls (Share + Close) */}
          <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (selectedImage) {
                  sharePhotoOnWhatsApp({
                    imageUrl: selectedImage,
                    phoneNo: contactNo || alternativeNo,
                    clientName: clientName,
                    title: `Client ${clientNo} Photo`,
                  });
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-full shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
              title="Share on WhatsApp"
            >
              <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span className="hidden sm:inline">Share WhatsApp</span>
            </button>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Close Fullscreen View"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Full Screen Image Wrapper with Pan and Zoom */}
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
              <Image
                src={selectedImage}
                alt="Fullscreen View"
                fill
                sizes="100vw"
                className="object-contain pointer-events-none"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
