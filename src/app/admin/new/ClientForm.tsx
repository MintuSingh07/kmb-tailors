'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Stroke {
  color: string;
  width: number;
  points: { x: number; y: number }[];
  page?: number; // Optional page identifier
}

export default function ClientForm() {
  const router = useRouter();

  // Form states
  const [clientNo, setClientNo] = useState('');
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [alternativeNo, setAlternativeNo] = useState('');
  const [category, setCategory] = useState('Suit');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<string[]>([]); // Base64 data URLs
  const [measurementDrawing, setMeasurementDrawing] = useState<string>(''); // Base64 canvas URL fallback (Page 1)
  const [measurementDrawings, setMeasurementDrawings] = useState<string[]>([]); // Multi-page drawings
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);

  // Autocomplete suggestions states
  const [justSelected, setJustSelected] = useState(false);
  const [suggestions, setSuggestions] = useState<{ clientNo: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement | null>(null);

  // Drawing canvas states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentColor, setCurrentColor] = useState('#1A1A1A');
  const [currentWidth, setCurrentWidth] = useState(4);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load draft or query parameter on mount
  useEffect(() => {
    // 1. Check if there is a 'code' query parameter in the URL
    const params = new URLSearchParams(window.location.search);
    const queryCode = params.get('code');
    const autoDraw = params.get('draw') === 'true';
    
    if (queryCode) {
      handleSelectClient(queryCode);
      if (autoDraw) {
        setIsDrawingOpen(true);
      }
      return;
    }

    // 2. Fallback to localStorage draft
    const savedDraft = localStorage.getItem('kmb_client_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.name) setName(draft.name);
        if (draft.contactNo) setContactNo(draft.contactNo);
        if (draft.alternativeNo) setAlternativeNo(draft.alternativeNo);
        if (draft.category) setCategory(draft.category);
        if (draft.price) setPrice(draft.price);
        if (draft.images) setImages(draft.images);
        if (draft.measurementDrawing) setMeasurementDrawing(draft.measurementDrawing);
        if (draft.measurementDrawings) setMeasurementDrawings(draft.measurementDrawings);
        if (draft.totalPages) setTotalPages(draft.totalPages);
        if (draft.currentPage) setCurrentPage(draft.currentPage);
        if (draft.strokes) setStrokes(draft.strokes);
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, []);

  // Save draft to localStorage on change
  useEffect(() => {
    if (clientNo) {
      const draft = {
        name,
        clientNo,
        contactNo,
        alternativeNo,
        category,
        price,
        images,
        measurementDrawing,
        measurementDrawings,
        totalPages,
        currentPage,
        strokes,
      };
      localStorage.setItem('kmb_client_draft', JSON.stringify(draft));
    }
  }, [name, clientNo, contactNo, alternativeNo, category, price, images, measurementDrawing, measurementDrawings, totalPages, currentPage, strokes]);

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch client code search suggestions when clientNo input changes
  useEffect(() => {
    if (justSelected) {
      setJustSelected(false);
      return;
    }

    if (clientNo.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`/api/clients/search?query=${encodeURIComponent(clientNo)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [clientNo]);

  // Load full client details and autofill the form
  async function handleSelectClient(selectedClientNo: string) {
    setLoading(true);
    setError('');
    setSuccess('');
    setShowSuggestions(false);
    setSuggestions([]);
    
    try {
      const response = await fetch(`/api/clients/${encodeURIComponent(selectedClientNo)}`);
      if (!response.ok) {
        throw new Error('Failed to load client details');
      }
      
      const client = await response.json();
      
      setName(client.name || '');
      setContactNo(client.contactNo || '');
      setAlternativeNo(client.alternativeNo || '');
      setCategory(client.category || 'Suit');
      setPrice(client.price !== undefined ? String(client.price) : '');
      setImages(client.images || []);
      setMeasurementDrawing(client.measurementDrawing || '');
      setMeasurementDrawings(client.measurementDrawings || [client.measurementDrawing || '']);
      setStrokes(client.strokes || []);
      setTotalPages(Math.max(client.measurementDrawings?.length || 1, 1));
      setCurrentPage(1);
      
      setJustSelected(true);
      setClientNo(client.clientNo);
      setIsEditMode(true);
      
      setSuccess(`Loaded measurements for ${client.name}!`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Error loading client data');
    } finally {
      setLoading(false);
    }
  };

  // Multi-image change handler
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

  // Remove image preview chip
  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Drawing board: initialize and redraw
  useEffect(() => {
    if (isDrawingOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      redrawCanvas();
    }
  }, [isDrawingOpen, strokes, currentPage]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Create an offscreen canvas to isolate drawing strokes and erasures
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    // Draw saved strokes onto the offscreen canvas
    offCtx.lineCap = 'round';
    offCtx.lineJoin = 'round';

    const activeStrokes = strokes.filter(
      (stroke) => stroke.page === currentPage || (!stroke.page && currentPage === 1)
    );

    activeStrokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      offCtx.beginPath();
      offCtx.strokeStyle = stroke.color;
      offCtx.lineWidth = stroke.width;

      // Use destination-out blend mode for erasers to clear drawing pixels to transparent
      if (stroke.color === '#FFFFFF') {
        offCtx.globalCompositeOperation = 'destination-out';
      } else {
        offCtx.globalCompositeOperation = 'source-over';
      }

      offCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        offCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      offCtx.stroke();
    });

    // 2. Clear the visible canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. Draw the notebook guidelines (Google Keep style grid) on the visible canvas
    ctx.strokeStyle = '#F0E7D5';
    ctx.lineWidth = 1.5;
    for (let y = 40; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 4. Draw the strokes layer on top of guidelines (erased parts are transparent, drawing lines are opaque)
    ctx.drawImage(offscreen, 0, 0);
  };

  // Canvas interaction (Pointer Events supporting Touch, Mouse, Stylus/S-Pen)
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Convert relative client click to relative logical coordinate inside 1000x750 canvas
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    
    // Create new stroke (multiply width by 4 for eraser to make it efficient)
    const actualWidth = currentColor === '#FFFFFF' ? currentWidth * 4 : currentWidth;
    const newStroke: Stroke = {
      color: currentColor,
      width: actualWidth,
      points: [coords],
      page: currentPage,
    };
    
    setStrokes((prev) => [...prev, newStroke]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || strokes.length === 0) return;
    e.preventDefault();
    
    const coords = getCanvasCoords(e);
    
    // Update the active stroke (last element)
    setStrokes((prev) => {
      const copy = [...prev];
      const active = copy[copy.length - 1];
      
      // Prevent push coordinates that are identical to the last point
      const lastPoint = active.points[active.points.length - 1];
      if (!lastPoint || lastPoint.x !== coords.x || lastPoint.y !== coords.y) {
        active.points.push(coords);
      }
      return copy;
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setIsDrawing(false);
  };

  // Whiteboard controls
  const handleUndo = () => {
    const pageStrokeIndices: number[] = [];
    strokes.forEach((s, idx) => {
      if (s.page === currentPage || (!s.page && currentPage === 1)) {
        pageStrokeIndices.push(idx);
      }
    });
    if (pageStrokeIndices.length > 0) {
      const lastIdx = pageStrokeIndices[pageStrokeIndices.length - 1];
      setStrokes((prev) => prev.filter((_, idx) => idx !== lastIdx));
    }
  };

  const handleClear = () => {
    if (confirm(`Clear all drawings on page ${currentPage}?`)) {
      setStrokes((prev) =>
        prev.filter((s) => s.page !== currentPage && (s.page !== undefined || currentPage !== 1))
      );
    }
  };

  // Page shifting helpers
  const savePageDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setMeasurementDrawings((prev) => {
      const next = [...prev];
      next[currentPage - 1] = dataUrl;
      return next;
    });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      savePageDataUrl();
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      savePageDataUrl();
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleAddPage = () => {
    savePageDataUrl();
    const newPageNum = totalPages + 1;
    setTotalPages(newPageNum);
    setCurrentPage(newPageNum);
  };

  const handleSaveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Generate data URL of active page
    const dataUrl = canvas.toDataURL('image/png');
    
    setMeasurementDrawings((prev) => {
      const next = [...prev];
      next[currentPage - 1] = dataUrl;
      
      // Fallback for first page to compatibility measurementDrawing
      const firstPage = next[0] || dataUrl;
      setMeasurementDrawing(firstPage);
      
      return next;
    });
    
    setIsDrawingOpen(false);
  };

  const handleCancelDrawing = () => {
    setIsDrawingOpen(false);
  };

  // Submit client form details to server API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientNo,
          name,
          contactNo,
          alternativeNo,
          category,
          images,
          measurementDrawing,
          measurementDrawings,
          strokes,
          price: price ? Number(price) : 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register client measurements');
      }

      setSuccess(data.message || 'Client measurement profile saved successfully!');
      setIsEditMode(false);
      localStorage.removeItem('kmb_client_draft');
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full z-10">
      {/* Header Back Button */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-slate-500 hover:text-[#9E7D3B] text-base sm:text-lg font-semibold transition-colors duration-150"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <span className="text-slate-400 text-sm font-semibold sm:text-base select-none">KMB Tailor Form</span>
      </div>

      <div className="rounded-3xl border border-[#E6DFD3] bg-[#FCFAF5] p-6 sm:p-10 shadow-xl shadow-slate-200/40">
        <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] mb-8 border-b border-[#E6DFD3]/60 pb-4 flex items-center gap-3 flex-wrap">
          New Measurement File
          {isEditMode && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-[#9E7D3B] border border-[#E6DFD3] uppercase tracking-wider animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9E7D3B]" />
              Editing Profile
            </span>
          )}
        </h1>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-base font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-base font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Left Column: Form Inputs */}
          <div className="space-y-6">
            <div ref={autocompleteRef} className="relative">
              <label className="block text-base sm:text-lg font-bold text-slate-600 mb-2">
                Client Code / File No.
              </label>
              <input
                type="text"
                value={clientNo}
                onChange={(e) => {
                  setClientNo(e.target.value);
                  setIsEditMode(false);
                }}
                required
                placeholder="e.g. KMB-26-8940"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:outline-none transition-all duration-150"
              />

              {/* Autocomplete suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E6DFD3] rounded-xl shadow-xl z-20 overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {suggestions.map((s) => (
                    <button
                      key={s.clientNo}
                      type="button"
                      onClick={() => handleSelectClient(s.clientNo)}
                      className="w-full px-4 py-3 text-left hover:bg-[#FCFAF5] flex items-center justify-between transition-colors group"
                    >
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[#9E7D3B] text-sm sm:text-base group-hover:text-[#C5A85C] transition-colors">
                          {s.clientNo}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">
                          {s.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#9E7D3B] opacity-0 group-hover:opacity-100 transition-opacity">
                        Auto-fill &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-600 mb-2">
                Client Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter client's full name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:outline-none transition-all duration-150"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-600 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  required
                  placeholder="Primary phone number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:outline-none transition-all duration-150"
                />
              </div>
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-600 mb-2">
                  Alternative Number
                </label>
                <input
                  type="tel"
                  value={alternativeNo}
                  onChange={(e) => setAlternativeNo(e.target.value)}
                  placeholder="Optional backup number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:outline-none transition-all duration-150"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-600 mb-2">
                  Suit Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base sm:text-lg font-semibold text-slate-800 shadow-sm focus:border-[#C5A85C] focus:outline-none transition-all duration-150"
                >
                  <option value="Suit">Three-Piece Suit</option>
                  <option value="Sherwani">Sherwani</option>
                  <option value="Kurta">Kurta / Pyjama</option>
                  <option value="Coat">Waistcoat / Blazer</option>
                  <option value="Pants">Trousers / Pants</option>
                  <option value="Shirt">Shirt</option>
                </select>
              </div>

              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-600 mb-2">
                  Stitching Price (Rs.)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={price}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                    setPrice(cleaned);
                  }}
                  required
                  placeholder="e.g. 8500"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:outline-none transition-all duration-150"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Uploaders and Sketch previews */}
          <div className="space-y-6">
            {/* Gallery/Camera Uploads */}
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-600 mb-2">
                Style Catalog / Customer Photos
              </label>
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  id="image-file"
                  className="hidden"
                />
                <label
                  htmlFor="image-file"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-[#E6DFD3] hover:border-[#C5A85C] bg-white rounded-2xl p-6 cursor-pointer shadow-sm transition-all duration-200"
                >
                  <svg className="h-10 w-10 text-[#9E7D3B] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-base font-bold text-slate-700">Add Photos</span>
                  <span className="text-xs text-slate-400 mt-1">Select from library or tap camera</span>
                </label>
              </div>

              {/* Photos Previews Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {images.map((imgData, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group shadow-sm bg-slate-100"
                    >
                      <Image
                        src={imgData}
                        alt={`Preview ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 33vw, 25vw"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/95 transition-colors focus:outline-none"
                      >
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Canvas Sketch Board Preview */}
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-600 mb-2">
                Measurement Sketch (White Board)
              </label>

              {/* Preview Container: Opens Modal Drawing Board on click */}
              <div
                onClick={() => setIsDrawingOpen(true)}
                className="relative w-full aspect-[4/3] bg-white border border-[#E6DFD3] hover:border-[#C5A85C] rounded-2xl overflow-hidden cursor-pointer shadow-sm flex items-center justify-center group transition-all duration-200"
              >
                {measurementDrawing ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={measurementDrawing}
                      alt="Canvas Preview"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-[#1A1A1A]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                      <span className="bg-white/95 text-slate-800 text-sm font-extrabold px-4 py-2 rounded-xl shadow-md flex items-center gap-2">
                        <svg className="h-4 w-4 text-[#9E7D3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit White Board
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-3 group-hover:scale-110 transition-transform">
                      <svg className="h-10 w-10 text-[#9E7D3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <span className="text-base font-bold text-slate-700">Tap to draw measurements</span>
                    <span className="text-xs text-slate-400 mt-1">Supports touch, mouse, & stylus S-Pen</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submitting buttons */}
          <div className="lg:col-span-2 pt-6 border-t border-[#E6DFD3]/60">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#DFBA6B] to-[#9E7D3B] hover:from-[#E3C277] hover:to-[#A78542] py-4 text-base sm:text-lg font-black text-white shadow-lg shadow-[#9E7D3B]/20 transition-all duration-150 disabled:opacity-50 hover:scale-[1.01]"
            >
              {loading ? 'Registering File...' : 'Save Customer File'}
            </button>
          </div>
        </form>
      </div>

      {/* FULLSCREEN DRAWING BOARD MODAL OVERLAY */}
      {isDrawingOpen && (
        <div className="fixed inset-0 bg-[#FCFAF5] z-50 flex flex-col justify-between backdrop-blur-md">
          {/* Top Panel: Action Controls */}
          <div className="bg-white border-b border-[#E6DFD3] px-4 pt-10 pb-3 sm:pt-4 flex flex-col min-[600px]:flex-row gap-3 items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-slate-800 text-lg sm:text-xl">Measurement Board</span>
            </div>

            {/* Page Navigation Controls */}
            <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner select-none">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Previous Page"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <span className="text-xs font-black text-slate-700 min-w-[72px] text-center">
                Page {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Next Page"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Plus Sign Button to Add Page */}
              <button
                type="button"
                onClick={handleAddPage}
                className="p-1.5 bg-[#9E7D3B] hover:bg-[#A78542] text-white rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm flex items-center justify-center"
                title="Add Another Page"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="h-10 px-3 bg-white rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-sm font-semibold flex items-center gap-1.5 shadow-sm"
                title="Undo Stroke"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span className="hidden sm:inline">Undo</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={strokes.length === 0}
                className="h-10 px-3 bg-white rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-sm font-semibold flex items-center gap-1.5 shadow-sm"
                title="Clear All"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Clear</span>
              </button>

              <button
                type="button"
                onClick={handleCancelDrawing}
                className="h-10 px-4 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-200 text-sm font-semibold shadow-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveDrawing}
                className="h-10 px-4 bg-gradient-to-r from-[#DFBA6B] to-[#9E7D3B] hover:from-[#E3C277] hover:to-[#A78542] rounded-lg text-white text-sm font-black shadow-md shadow-[#9E7D3B]/20"
              >
                Done
              </button>
            </div>
          </div>

          {/* Center Drawing Area */}
          <div className="flex-1 w-full flex items-center justify-center p-3 sm:p-4">
            <div 
              style={{
                maxHeight: 'calc(100vh - 190px)',
                width: 'calc((100vh - 190px) * 4 / 3)',
                maxWidth: '100%',
              }}
              className="relative aspect-[4/3] bg-white rounded-2xl shadow-xl border border-[#E6DFD3] overflow-hidden"
            >
              <canvas
                ref={canvasRef}
                width={1000}
                height={750}
                className="w-full h-full cursor-crosshair touch-none bg-white"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
            </div>
          </div>

          {/* Bottom Panel: Brush styles & Color Selection */}
          <div className="bg-white border-t border-[#E6DFD3] px-6 pt-4 pb-8 sm:py-5 flex flex-col md:flex-row gap-6 items-center justify-between shadow-inner">
            {/* Color Palette */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider select-none text-center sm:text-left">
                Ink Color
              </span>
              <div className="flex items-center justify-center gap-4 sm:gap-3">
                {[
                  { hex: '#1A1A1A', name: 'Black' },
                  { hex: '#E53E3E', name: 'Red' },
                  { hex: '#3182CE', name: 'Blue' },
                  { hex: '#38A169', name: 'Green' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setCurrentColor(c.hex)}
                    className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-slate-200 transition-all duration-200 ${
                      currentColor === c.hex
                        ? 'scale-110 ring-4 ring-[#9E7D3B]/30 border-[#9E7D3B]'
                        : 'hover:scale-105 active:scale-95'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}

                {/* Divider */}
                <div className="w-[1px] h-8 bg-slate-200 mx-1 select-none" />

                {/* Eraser Button */}
                <button
                  type="button"
                  onClick={() => setCurrentColor('#FFFFFF')}
                  className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl border border-slate-200 flex items-center justify-center bg-white text-slate-500 hover:text-slate-700 transition-all duration-200 ${
                    currentColor === '#FFFFFF'
                      ? 'scale-110 ring-4 ring-[#9E7D3B]/30 border-[#9E7D3B] bg-slate-50'
                      : 'hover:scale-105 active:scale-95'
                  }`}
                  title="Eraser"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                    <path d="m22 21H7" />
                    <path d="m5 11 9 9" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Brush Width Selector (Segmented Control) */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider select-none text-center sm:text-left">
                Line Width
              </span>
              <div className="flex bg-slate-200/60 p-1 rounded-xl w-full sm:w-64 max-w-sm">
                {[
                  { size: 2, name: 'Thin' },
                  { size: 4, name: 'Medium' },
                  { size: 7, name: 'Thick' },
                ].map((w) => (
                  <button
                    key={w.size}
                    type="button"
                    onClick={() => setCurrentWidth(w.size)}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-150 ${
                      currentWidth === w.size
                        ? 'bg-white text-slate-800 shadow-md scale-[1.02]'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
