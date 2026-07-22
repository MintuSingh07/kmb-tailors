'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CATEGORY_GROUPS } from '../../../lib/categories';

interface Stroke {
  color: string;
  width: number;
  points: { x: number; y: number }[];
  page?: number; // Optional page identifier
  text?: string;
}

const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
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
        reject(new Error('Failed to load image for compression'));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

export default function ClientForm() {
  const router = useRouter();

  // Form states
  const [clientNo, setClientNo] = useState('');
  const [dbId, setDbId] = useState('');
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [alternativeNo, setAlternativeNo] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('Punjabi Suit');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [suitStatus, setSuitStatus] = useState<'Pending' | 'Prepared but not handovered' | 'Completed and handovered'>('Pending');
  const [price, setPrice] = useState('');
  const [suitQuantity, setSuitQuantity] = useState<string>('');
  const [images, setImages] = useState<string[]>([]); // Base64 fabric data URLs
  const [handoverImages, setHandoverImages] = useState<string[]>([]); // Base64 handover data URLs
  const [measurementDrawing, setMeasurementDrawing] = useState<string>(''); // Base64 canvas URL fallback (Page 1)
  const [measurementDrawings, setMeasurementDrawings] = useState<string[]>([]); // Multi-page drawings
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('left');
  const [prevPageSnapshot, setPrevPageSnapshot] = useState('');
  const [currentPageSnapshot, setCurrentPageSnapshot] = useState('');
  const [initialStatus, setInitialStatus] = useState<string>('Pending');

  // Lightbox viewer state
  const [activeLightbox, setActiveLightbox] = useState<{
    images: string[];
    title: string;
  } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
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
  const [eraserSize, setEraserSize] = useState(20);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const activePointsRef = useRef<{ x: number; y: number }[]>([]);
  const [drawMode, setDrawMode] = useState<'draw' | 'text' | 'none'>('draw');
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panInitialOffsetRef = useRef({ x: 0, y: 0 });

  // Text editor overlay state
  const [activeTextEditor, setActiveTextEditor] = useState<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    text: string;
    fontSize: number;
    color?: string;
  } | null>(null);

  // Draggable text states
  const [draggingText, setDraggingText] = useState<{
    strokeIndex: number;
    startX: number;
    startY: number;
    pointerStartX: number;
    pointerStartY: number;
  } | null>(null);
  const [hasDraggedText, setHasDraggedText] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isResizingText, setIsResizingText] = useState(false);

  // Load query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('id');
    const queryCode = params.get('code');
    const autoDraw = params.get('draw') === 'true';
    
    if (queryId) {
      handleSelectClient(queryId, false, true);
      if (autoDraw) {
        setIsDrawingOpen(true);
      }
      return;
    } else if (queryCode) {
      handleSelectClient(queryCode, false, false);
      if (autoDraw) {
        setIsDrawingOpen(true);
      }
      return;
    }
  }, []);

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

  // Reset zoom and pan offset when page or drawing modal changes
  useEffect(() => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [currentPage, isDrawingOpen]);

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
  async function handleSelectClient(selectedClientNo: string, isAutofillOnly = false, loadById = false) {
    setLoading(true);
    setError('');
    setSuccess('');
    setShowSuggestions(false);
    setSuggestions([]);
    
    try {
      const url = loadById 
        ? `/api/clients/${encodeURIComponent(selectedClientNo)}?by=id`
        : `/api/clients/${encodeURIComponent(selectedClientNo)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load client details');
      }
      
      const client = await response.json();
      
      setName(client.name || '');
      setContactNo(client.contactNo || '');
      setAddress(client.address || '');
      
      if (isAutofillOnly) {
        setAlternativeNo('');
        setCategory('Punjabi Suit');
        setPrice('');
        setSuitQuantity('');
        setImages([]);
        setHandoverImages([]);
        setMeasurementDrawing('');
        setMeasurementDrawings(new Array(10).fill(''));
        setStrokes([]);
        setTotalPages(10);
        setCurrentPage(1);
        setSuitStatus('Pending');
        setInitialStatus('Pending');
        setDbId(''); // Clear database ID so a new record is created for autofill
      } else {
        setAlternativeNo(client.alternativeNo || '');
        setCategory(client.category || 'Punjabi Suit');
        setPrice(client.price !== undefined ? String(client.price) : '');
        setSuitQuantity(client.suitQuantity || '');
        setImages(client.images || []);
        setHandoverImages(client.handoverImages || []);
        const loadedDrawings = client.measurementDrawings || [];
        const finalDrawings = [...loadedDrawings];
        while (finalDrawings.length < 10) {
          finalDrawings.push('');
        }
        setMeasurementDrawing(client.measurementDrawing || '');
        setMeasurementDrawings(finalDrawings);
        setStrokes(client.strokes || []);
        setTotalPages(finalDrawings.length);
        setCurrentPage(1);
        setSuitStatus(client.suitStatus || 'Pending');
        setInitialStatus(client.suitStatus || 'Pending');
        setDbId(client._id); // Set database ID to update existing query
      }
      
      setJustSelected(true);
      setClientNo(client.clientNo);
      setIsEditMode(!isAutofillOnly);
      
      if (isAutofillOnly) {
        setSuccess(`Autofilled customer details for ${client.name}!`);
      } else {
        setSuccess(`Loaded measurements for ${client.name}!`);
      }
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Error loading client data');
    } finally {
      setLoading(false);
    }
  };

  // Multi-image change handler
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      try {
        const compressedDataUrl = await compressImage(file);
        setImages((prev) => [...prev, compressedDataUrl]);
      } catch (err) {
        console.error('Error compressing image:', err);
        // Fallback to original read
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setImages((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Remove image preview chip
  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handover image uploader handler
  const handleHandoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      try {
        const compressedDataUrl = await compressImage(file);
        setHandoverImages((prev) => [...prev, compressedDataUrl]);
      } catch (err) {
        console.error('Error compressing image:', err);
        // Fallback to original read
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setHandoverImages((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Remove handover image preview chip
  const removeHandoverImage = (indexToRemove: number) => {
    setHandoverImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Commit text overlays onto the sketch canvas
  const commitText = (editor = activeTextEditor) => {
    if (!editor) return;
    if (editor.text.trim()) {
      // Back-calculate stroke.width from editor.fontSize
      // Canvas fontSize = Math.max(16, stroke.width * 6), so stroke.width = fontSize / 6
      const calculatedWidth = editor.fontSize / 6;

      const textStroke: Stroke = {
        color: editor.color || (currentColor === '#FFFFFF' ? '#1A1A1A' : currentColor),
        width: calculatedWidth,
        points: [{ x: editor.canvasX, y: editor.canvasY }],
        page: currentPage,
        text: editor.text.trim(),
      };
      setStrokes((prev) => [...prev, textStroke]);
    }
    setActiveTextEditor(null);
    setDrawMode('draw');
  };

  const prevLightboxPhoto = () => {
    if (!activeLightbox) return;
    setLightboxIndex((prev) => (prev === 0 ? activeLightbox.images.length - 1 : prev - 1));
  };

  const nextLightboxPhoto = () => {
    if (!activeLightbox) return;
    setLightboxIndex((prev) => (prev === activeLightbox.images.length - 1 ? 0 : prev + 1));
  };

  // Drag to resize reference and pointer handlers
  const textInputRef = useRef<HTMLInputElement>(null);
  const resizeStartRef = useRef<{ startX: number; startY: number; initialFontSize: number } | null>(null);
  const resizePointerIdRef = useRef<number | null>(null);
  const resizeTargetRef = useRef<Element | null>(null);

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!activeTextEditor) return;
    
    // Capture the pointer so touch move events keep firing even when finger leaves the element
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    resizePointerIdRef.current = e.pointerId;
    resizeTargetRef.current = target;

    setIsResizingText(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialFontSize: activeTextEditor.fontSize,
    };
  };

  // Global window listeners to ensure smooth, uninterrupted drag resizing on mobile/touch screens
  useEffect(() => {
    if (!isResizingText) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!resizeStartRef.current || !activeTextEditor) return;
      
      // Use diagonal drag distance for smooth, precise control
      // Dragging down-right increases size, up-left decreases
      const deltaX = e.clientX - resizeStartRef.current.startX;
      const deltaY = e.clientY - resizeStartRef.current.startY;
      // Combine both axes with slight diagonal bias for natural feel
      const diagonal = (deltaX + deltaY) / 2;
      // 0.5px of drag = 1px of font size change for precise control
      const newFontSize = Math.round(
        Math.min(200, Math.max(10, resizeStartRef.current.initialFontSize + diagonal * 0.5))
      );
      
      setActiveTextEditor(prev => prev ? { ...prev, fontSize: newFontSize } : null);
    };

    const handleGlobalPointerUp = () => {
      // Release pointer capture if active
      if (resizePointerIdRef.current !== null && resizeTargetRef.current) {
        try {
          resizeTargetRef.current.releasePointerCapture(resizePointerIdRef.current);
        } catch (_) { /* already released */ }
      }
      resizePointerIdRef.current = null;
      resizeTargetRef.current = null;
      setIsResizingText(false);
      resizeStartRef.current = null;
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isResizingText, activeTextEditor]);

  // Focus the text input with preventScroll to stop browsers from auto-scrolling/panning the viewport on focus
  useEffect(() => {
    if (activeTextEditor && textInputRef.current) {
      const timer = setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus({ preventScroll: true });
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [activeTextEditor]);

  // Drawing board: initialize, resize, and redraw
  useEffect(() => {
    if (isDrawingOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Prevent upscaling and stretching by aligning canvas backing store size with DPR physical pixels
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      redrawCanvas();
    }
  }, [isDrawingOpen, strokes, currentPage, scale, panOffset]);

  // Handle window resizing / tablet rotation to keep drawings razor sharp
  useEffect(() => {
    const handleResize = () => {
      if (isDrawingOpen && canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        redrawCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDrawingOpen, strokes, currentPage, scale, panOffset]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Calculate CSS pixels from physical dimensions
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;

    // Calculate scale factors from 1000x750 logical space to CSS pixel size
    const scaleX = cssWidth / 1000;
    const scaleY = cssHeight / 750;

    // 1. Create an offscreen canvas matching the current physical high-DPI size
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    // Scale offCtx by dpr so we can draw vector elements in CSS units
    offCtx.scale(dpr, dpr);
    offCtx.lineCap = 'round';
    offCtx.lineJoin = 'round';

    // Apply pan and zoom context transformations to offscreen canvas
    offCtx.save();
    offCtx.translate(panOffset.x * scaleX, panOffset.y * scaleY);
    offCtx.scale(scale, scale);

    const activeStrokes = strokes.filter(
      (stroke) => stroke.page === currentPage || (!stroke.page && currentPage === 1)
    );

    activeStrokes.forEach((stroke) => {
      if (stroke.text) {
        offCtx.beginPath();
        offCtx.fillStyle = stroke.color;
        offCtx.globalCompositeOperation = 'source-over';
        
        // Scale font size and coordinates proportionally in CSS coordinates
        const baseFontSize = Math.max(16, stroke.width * 6);
        const fontSize = Math.round(baseFontSize * scaleX);
        offCtx.font = `bold ${fontSize}px sans-serif`;
        
        const renderX = stroke.points[0].x * scaleX;
        const renderY = stroke.points[0].y * scaleY;
        offCtx.textBaseline = 'middle';
        offCtx.fillText(stroke.text, renderX, renderY);
      } else {
        if (stroke.points.length === 0) return;
        offCtx.beginPath();
        offCtx.strokeStyle = stroke.color;
        
        // Scale line width proportionally in CSS coordinates
        offCtx.lineWidth = stroke.width * scaleX;

        if (stroke.color === '#FFFFFF') {
          offCtx.globalCompositeOperation = 'destination-out';
        } else {
          offCtx.globalCompositeOperation = 'source-over';
        }

        offCtx.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
        for (let i = 1; i < stroke.points.length; i++) {
          offCtx.lineTo(stroke.points[i].x * scaleX, stroke.points[i].y * scaleY);
        }
        offCtx.stroke();
      }
    });
    offCtx.restore();

    // 2. Clear the visible canvas in absolute physical pixels
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to clear physical pixels
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. Draw visible canvas components (guidelines) in CSS scale
    ctx.scale(dpr, dpr);
    
    // Apply pan and zoom to guidelines as well so they zoom/pan properly
    ctx.save();
    ctx.translate(panOffset.x * scaleX, panOffset.y * scaleY);
    ctx.scale(scale, scale);

    ctx.strokeStyle = '#F0E7D5';
    ctx.lineWidth = 1.5 / scale; // Prevent lines getting too thick when zooming in
    
    // Calculate visible viewport range in logical coordinates to fill entire visible area
    const yMin = -panOffset.y / scale;
    const yMax = (750 - panOffset.y) / scale;
    const xMin = -panOffset.x / scale;
    const xMax = (1000 - panOffset.x) / scale;

    const startLogicalY = Math.floor(yMin / 40) * 40;
    const endLogicalY = Math.ceil(yMax / 40) * 40;

    for (let ly = startLogicalY; ly <= endLogicalY; ly += 40) {
      ctx.beginPath();
      ctx.moveTo(xMin * scaleX, ly * scaleY);
      ctx.lineTo(xMax * scaleX, ly * scaleY);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Draw offscreen canvas 1:1 onto visible canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to copy physical buffer 1-to-1
    ctx.drawImage(offscreen, 0, 0);
    
    ctx.restore(); // Restore context state
  };

  // Canvas interaction (Pointer Events supporting Touch, Mouse, Stylus/S-Pen)
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Normalize coordinates in CSS pixels
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    
    // Map to base 1000x750 layout
    let x = (cssX / rect.width) * 1000;
    let y = (cssY / rect.height) * 750;

    // Apply inverse zoom and pan
    x = (x - panOffset.x) / scale;
    y = (y - panOffset.y) / scale;

    return { x, y };
  };

  const getTextEditorPosition = () => {
    if (!activeTextEditor) return { x: 0, y: 0 };
    const xCSS = ((activeTextEditor.canvasX * scale + panOffset.x) / 1000) * 100;
    const yCSS = ((activeTextEditor.canvasY * scale + panOffset.y) / 750) * 100;
    return { x: xCSS, y: yCSS };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // Ignore touch/finger events for drawing/editing (only allow touch for panning in 'none' mode)
    if (e.pointerType === 'touch' && drawMode !== 'none') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if we should pan
    if (drawMode === 'none') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panInitialOffsetRef.current = { ...panOffset };
      canvas.setPointerCapture(e.pointerId);
      return;
    }

    const coords = getCanvasCoords(e);

    // If there's an active text editor open, commit it first (supports click-outside-to-save on mobile/tablet)
    if (activeTextEditor) {
      commitText(activeTextEditor);
      return; // Return early so the click that commits does not trigger accidental new strokes/text inputs
    }

    // 1. ALWAYS check hit-test for existing text strokes first (even in draw mode!)
    const activeStrokes = strokes.filter(
      (stroke) => stroke.page === currentPage || (!stroke.page && currentPage === 1)
    );

    let matchedStroke = null;
    let matchedStrokeIndex = -1;
    for (let i = 0; i < strokes.length; i++) {
      const stroke = strokes[i];
      const isCurrentPage = stroke.page === currentPage || (!stroke.page && currentPage === 1);
      if (isCurrentPage && stroke.text) {
        const fontSize = Math.max(16, stroke.width * 6);
        const textWidth = stroke.text.length * (fontSize * 0.65);
        const margin = 20; // tap tolerance margin

        if (
          coords.x >= stroke.points[0].x - margin &&
          coords.x <= stroke.points[0].x + textWidth + margin &&
          coords.y >= stroke.points[0].y - fontSize - margin &&
          coords.y <= stroke.points[0].y + margin
        ) {
          matchedStroke = stroke;
          matchedStrokeIndex = i;
          break;
        }
      }
    }

    if (matchedStroke) {
      // Start dragging text stroke
      setDraggingText({
        strokeIndex: matchedStrokeIndex,
        startX: matchedStroke.points[0].x,
        startY: matchedStroke.points[0].y,
        pointerStartX: coords.x,
        pointerStartY: coords.y,
      });
      setHasDraggedText(false);
      canvas.setPointerCapture(e.pointerId);
      setIsDrawing(true);
      isDrawingRef.current = true;
      return;
    }

    // 2. If no matched stroke and in text mode, create a new text editor overlay
    if (drawMode === 'text') {
      if (activeTextEditor) {
        commitText(activeTextEditor);
      }
      
      const rect = canvas.getBoundingClientRect();
      const percentX = ((e.clientX - rect.left) / rect.width) * 100;
      const percentY = ((e.clientY - rect.top) / rect.height) * 100;

      // Create new text editor
      const initialFontSize = Math.max(16, currentWidth * 6);
      setActiveTextEditor({
        x: percentX,
        y: percentY,
        canvasX: coords.x,
        canvasY: coords.y,
        text: '',
        fontSize: initialFontSize,
        color: currentColor === '#FFFFFF' ? '#1A1A1A' : currentColor,
      });
      return;
    }

    // Only allow drawing if Pen/Eraser mode is active (drawMode === 'draw')
    if (drawMode === 'draw') {
      canvas.setPointerCapture(e.pointerId);
      setIsDrawing(true);
      isDrawingRef.current = true;
      activePointsRef.current = [coords];

      // Draw initial dot
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = canvas.width / dpr;
        const cssHeight = canvas.height / dpr;
        const scaleX = cssWidth / 1000;
        const scaleY = cssHeight / 750;

        const px = (coords.x * scale + panOffset.x) * scaleX * dpr;
        const py = (coords.y * scale + panOffset.y) * scaleY * dpr;

        const actualWidth = currentColor === '#FFFFFF' ? eraserSize : currentWidth;
        const physicalLineWidth = actualWidth * scaleX * scale * dpr;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = physicalLineWidth;
        ctx.strokeStyle = currentColor;

        if (currentColor === '#FFFFFF') {
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          ctx.globalCompositeOperation = 'source-over';
        }

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Ignore touch/finger events for drawing/editing (only allow touch for panning in 'none' mode)
    if (e.pointerType === 'touch' && drawMode !== 'none') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle active panning
    if (isPanningRef.current) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const dx = ((e.clientX - panStartRef.current.x) / rect.width) * 1000;
      const dy = ((e.clientY - panStartRef.current.y) / rect.height) * 750;
      setPanOffset({
        x: panInitialOffsetRef.current.x + dx,
        y: panInitialOffsetRef.current.y + dy,
      });
      return;
    }

    if (!isDrawingRef.current) return;
    e.preventDefault();
    
    const coords = getCanvasCoords(e);

    if (draggingText) {
      const dx = coords.x - draggingText.pointerStartX;
      const dy = coords.y - draggingText.pointerStartY;
      
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        setHasDraggedText(true);
      }

      setStrokes((prev) => {
        const copy = [...prev];
        const stroke = copy[draggingText.strokeIndex];
        if (stroke) {
          stroke.points = [{
            x: draggingText.startX + dx,
            y: draggingText.startY + dy,
          }];
        }
        return copy;
      });
      return;
    }

    if (drawMode !== 'draw') return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lastPoint = activePointsRef.current[activePointsRef.current.length - 1];
    if (!lastPoint || lastPoint.x !== coords.x || lastPoint.y !== coords.y) {
      activePointsRef.current.push(coords);

      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.width / dpr;
      const cssHeight = canvas.height / dpr;
      const scaleX = cssWidth / 1000;
      const scaleY = cssHeight / 750;

      const toPhysicalX = (val: number) => (val * scale + panOffset.x) * scaleX * dpr;
      const toPhysicalY = (val: number) => (val * scale + panOffset.y) * scaleY * dpr;

      const p1x = toPhysicalX(lastPoint.x);
      const p1y = toPhysicalY(lastPoint.y);
      const p2x = toPhysicalX(coords.x);
      const p2y = toPhysicalY(coords.y);

      const actualWidth = currentColor === '#FFFFFF' ? eraserSize : currentWidth;
      const physicalLineWidth = actualWidth * scaleX * scale * dpr;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = physicalLineWidth;
      ctx.strokeStyle = currentColor;

      if (currentColor === '#FFFFFF') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Ignore touch/finger events for drawing/editing (only allow touch for panning in 'none' mode)
    if (e.pointerType === 'touch' && drawMode !== 'none') {
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (isPanningRef.current) {
      e.preventDefault();
      isPanningRef.current = false;
      return;
    }

    if (!isDrawingRef.current) return;
    e.preventDefault();
    
    isDrawingRef.current = false;
    setIsDrawing(false);

    if (draggingText) {
      if (!hasDraggedText) {
        // User clicked text without dragging: enter text editor
        const strokeToEdit = strokes[draggingText.strokeIndex];
        if (strokeToEdit && canvas) {
          const strokeX = (strokeToEdit.points[0].x / 1000) * 100;
          const strokeY = (strokeToEdit.points[0].y / 750) * 100;
          const strokeFontSize = Math.max(16, strokeToEdit.width * 6);

          // Remove from list so it doesn't double-render during typing
          setStrokes((prev) => prev.filter((_, idx) => idx !== draggingText.strokeIndex));

          // Sync current active color with the stroke color
          setCurrentColor(strokeToEdit.color);

          setActiveTextEditor({
            x: strokeX,
            y: strokeY,
            canvasX: strokeToEdit.points[0].x,
            canvasY: strokeToEdit.points[0].y,
            text: strokeToEdit.text || '',
            fontSize: strokeFontSize,
            color: strokeToEdit.color,
          });
        }
      } else {
        // User dragged text: toggle text option off back to draw
        setDrawMode('draw');
      }
      setDraggingText(null);
      setHasDraggedText(false);
      return;
    }

    if (drawMode === 'draw' && activePointsRef.current.length > 0) {
      // Commit active stroke to React state
      const actualWidth = currentColor === '#FFFFFF' ? eraserSize : currentWidth;
      const newStroke: Stroke = {
        color: currentColor,
        width: actualWidth,
        points: [...activePointsRef.current],
        page: currentPage,
      };
      setStrokes((prev) => [...prev, newStroke]);
      activePointsRef.current = [];
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Get cursor position in CSS pixels relative to canvas
    const cursorCSSX = e.clientX - rect.left;
    const cursorCSSY = e.clientY - rect.top;

    // Translate CSS pixels to logical coordinates
    const cursorX = (cursorCSSX / rect.width) * 1000;
    const cursorY = (cursorCSSY / rect.height) * 750;

    // Calculate new scale
    const newScale = e.deltaY < 0 
      ? Math.min(scale * zoomFactor, 5) 
      : Math.max(scale / zoomFactor, 0.5);

    if (newScale !== scale) {
      const scaleRatio = newScale / scale;
      const newPanX = cursorX - (cursorX - panOffset.x) * scaleRatio;
      const newPanY = cursorY - (cursorY - panOffset.y) * scaleRatio;

      setScale(newScale);
      setPanOffset({ x: newPanX, y: newPanY });
    }
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
    setShowClearConfirm(true);
  };

  const executeClear = () => {
    setStrokes((prev) =>
      prev.filter((s) => s.page !== currentPage && (s.page !== undefined || currentPage !== 1))
    );
    setShowClearConfirm(false);
  };

  // Page shifting helpers
  // Page shifting helpers
  const savePageDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setMeasurementDrawings((prev) => {
      const next = [...prev];
      while (next.length < totalPages) {
        next.push('');
      }
      next[currentPage - 1] = dataUrl;
      return next;
    });
  };

  const changePageWithTransition = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === currentPage) return;
    
    const canvas = canvasRef.current;
    if (!canvas) {
      setCurrentPage(targetPage);
      return;
    }
    
    // Save current strokes to database array
    savePageDataUrl();
    const oldSnapshot = canvas.toDataURL('image/png');
    
    setPrevPageSnapshot(oldSnapshot);
    setTransitionDirection(targetPage > currentPage ? 'left' : 'right');
    setIsTransitioning(true);
    setCurrentPageSnapshot(''); // Clear new snapshot to mark start of capture tick
    setCurrentPage(targetPage);
    
    // Allow canvas redrawing lifecycle to render target strokes before taking snap
    setTimeout(() => {
      if (canvasRef.current) {
        const nextSnapshot = canvasRef.current.toDataURL('image/png');
        setCurrentPageSnapshot(nextSnapshot);
      }
      
      // Keep transition sliding view on top for 750ms duration
      setTimeout(() => {
        setIsTransitioning(false);
      }, 750);
    }, 40);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      changePageWithTransition(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      changePageWithTransition(currentPage + 1);
    }
  };

  const handleAddPage = () => {
    savePageDataUrl();
    const newPageNum = totalPages + 1;
    setTotalPages(newPageNum);
    
    // Run slide transition to newly created page
    setTimeout(() => {
      changePageWithTransition(newPageNum);
    }, 10);
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

    if (suitStatus === 'Completed and handovered' && (!handoverImages || handoverImages.length === 0)) {
      setError('Please upload at least one handover photo before marking as Completed.');
      return;
    }

    if (suitStatus === 'Completed and handovered' && (!price || Number(price) <= 0)) {
      setError('Please enter the stitching price when marking the order as Completed.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dbId,
          clientNo,
          name,
          contactNo,
          alternativeNo,
          address,
          category,
          suitQuantity,
          images,
          handoverImages,
          measurementDrawing,
          measurementDrawings,
          strokes,
          price: price ? Number(price) : 0,
          suitStatus,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register client measurements');
      }

      setSuccess(data.message || 'Client measurement profile saved successfully!');
      setIsEditMode(false);
      setDbId('');
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
        <span className="text-slate-400 text-sm font-semibold sm:text-base select-none">KMB Boutique Form</span>
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
                placeholder="Enter client code or file number (e.g. AQ-PRIYA, 101, or KMB-26)"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:outline-none transition-all duration-150"
              />

              {/* Autocomplete suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E6DFD3] rounded-xl shadow-xl z-20 overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {suggestions.map((s) => (
                    <button
                      key={s.clientNo}
                      type="button"
                      onClick={() => handleSelectClient(s.clientNo, true)}
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
                disabled={initialStatus === 'Completed and handovered'}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:outline-none transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
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
                  disabled={initialStatus === 'Completed and handovered'}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:outline-none transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
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
                  disabled={initialStatus === 'Completed and handovered'}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:outline-none transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-600 mb-2">
                Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter client's address"
                disabled={initialStatus === 'Completed and handovered'}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:outline-none transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed resize-none"
              />
            </div>

            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-600 mb-2">
                Suit Category
              </label>
              <button
                type="button"
                onClick={() => {
                  if (initialStatus !== 'Completed and handovered') {
                    setIsCategoryModalOpen(true);
                  }
                }}
                disabled={initialStatus === 'Completed and handovered'}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 shadow-sm hover:border-[#C5A85C] focus:outline-none transition-all duration-150 text-left cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                <span className="truncate">{category || 'Select Category'}</span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>
            </div>

            {isEditMode && (
              <div className="pt-6 border-t border-[#E6DFD3]/60 space-y-4">
                {initialStatus === 'Completed and handovered' ? (
                  <div className="space-y-4">
                    <label className="block text-base sm:text-lg font-bold text-slate-700">
                      Handover Photos
                    </label>
                    <p className="text-xs sm:text-sm text-emerald-600 font-bold flex items-center gap-1.5">
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      This order has been completed and handed over to the client.
                    </p>

                    {/* Static Read-only Handover Photos Previews Grid */}
                    {handoverImages.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
                        {handoverImages.map((imgData, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              setLightboxIndex(index);
                              setActiveLightbox({ images: handoverImages, title: `${name || 'Customer'} - Handover Photos` });
                            }}
                            className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-slate-100 cursor-zoom-in hover:opacity-90 transition-opacity"
                          >
                            <Image
                              src={imgData}
                              alt={`Handover Preview ${index + 1}`}
                              fill
                              sizes="(max-width: 640px) 33vw, 25vw"
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-400 font-medium italic">No handover photos uploaded.</p>
                    )}

                    {/* Read-only price display in completed view */}
                    <div className="pt-4 border-t border-slate-100">
                      <label className="block text-base sm:text-lg font-bold text-slate-700 mb-1.5">
                        Stitching Price (Rs.)
                      </label>
                      <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 shadow-sm select-none">
                        Rs. {price || '0'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="block text-base sm:text-lg font-bold text-slate-700">
                      Update Suit Status
                    </label>
                    <p className="text-xs sm:text-sm text-slate-500 font-semibold mb-3">
                      Select where this suit order belongs. Updating will transfer the record to the selected queue.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Option 1: Prepared but not handovered */}
                      <button
                        type="button"
                        onClick={() => setSuitStatus(suitStatus === 'Prepared but not handovered' ? 'Pending' : 'Prepared but not handovered')}
                        className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-200 cursor-pointer select-none ${
                          suitStatus === 'Prepared but not handovered'
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

                      {/* Option 2: Completed and handovered */}
                      <button
                        type="button"
                        onClick={() => setSuitStatus(suitStatus === 'Completed and handovered' ? 'Pending' : 'Completed and handovered')}
                        className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-200 cursor-pointer select-none ${
                          suitStatus === 'Completed and handovered'
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
                    
                    {/* Current State indicator */}
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest pt-2">
                      Current State: <span className="text-[#9E7D3B] font-extrabold">{suitStatus === 'Pending' ? 'PENDING (IN QUEUE)' : suitStatus.toUpperCase()}</span>
                    </div>

                    {suitStatus === 'Completed and handovered' && (
                      <div className="space-y-3 pt-2 bg-[#9E7D3B]/5 border border-[#9E7D3B]/20 rounded-2xl p-4 animate-in fade-in duration-200">
                        <label className="block text-sm sm:text-base font-bold text-slate-700">
                          Add Handover Photos <span className="text-rose-600 font-extrabold">(Required)</span>
                        </label>
                        <p className="text-xs text-rose-500/80 font-bold mb-2">
                          You must snap or upload at least one photo of the completed suit before giving it to the client.
                        </p>
                        
                        <div className="relative">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleHandoverImageChange}
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

                        {/* Handover Photos Previews Grid */}
                        {handoverImages.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                            {handoverImages.map((imgData, index) => (
                              <div
                                key={index}
                                className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group shadow-sm bg-slate-100 animate-in zoom-in-95 duration-150"
                              >
                                <Image
                                  src={imgData}
                                  alt={`Handover Preview ${index + 1}`}
                                  fill
                                  sizes="(max-width: 640px) 33vw, 25vw"
                                  className="object-cover cursor-zoom-in hover:scale-105 transition-transform"
                                  onClick={() => {
                                    setLightboxIndex(index);
                                    setActiveLightbox({ images: handoverImages, title: `${name || 'Customer'} - Handover Photos` });
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeHandoverImage(index)}
                                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/95 transition-colors focus:outline-none"
                                >
                                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Stitching Price Input for Handover State */}
                        <div className="pt-4 border-t border-[#E6DFD3]/60 space-y-2">
                          <label className="block text-sm sm:text-base font-bold text-slate-700">
                            Stitching Price (Rs.) <span className="text-rose-600 font-extrabold">(Required)</span>
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
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Uploaders and Sketch previews */}
          <div className="space-y-6">
            {/* Suit Quantity Input */}
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-600 mb-2">
                Quantity of Suits / Order Details
              </label>
              <input
                type="text"
                value={suitQuantity}
                disabled={initialStatus === 'Completed and handovered'}
                onChange={(e) => setSuitQuantity(e.target.value)}
                placeholder="e.g. 2 Suits, 1 Three-Piece, 3 Kurta Sets..."
                className="w-full rounded-2xl border border-[#E6DFD3] bg-white px-5 py-4 text-base sm:text-lg font-bold text-slate-800 focus:border-[#9E7D3B] focus:outline-none focus:ring-2 focus:ring-[#9E7D3B]/20 disabled:bg-slate-100 disabled:text-slate-500 shadow-sm transition-all"
              />
              <p className="text-xs text-slate-400 font-medium mt-2">
                Specify the number of suits ordered or any custom order notes.
              </p>
            </div>

            {/* Canvas Sketch Board Preview - only shown for pending/new suits */}
            {suitStatus !== 'Completed and handovered' && suitStatus !== 'Prepared but not handovered' && initialStatus !== 'Completed and handovered' && initialStatus !== 'Prepared but not handovered' && (
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
            )}
          </div>

          {/* Submitting buttons */}
          {initialStatus !== 'Completed and handovered' && (
            <div className="lg:col-span-2 pt-6 border-t border-[#E6DFD3]/60">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#DFBA6B] to-[#9E7D3B] hover:from-[#E3C277] hover:to-[#A78542] py-4 text-base sm:text-lg font-black text-white shadow-lg shadow-[#9E7D3B]/20 transition-all duration-150 disabled:opacity-50 hover:scale-[1.01]"
              >
                {loading ? 'Registering File...' : 'Save Customer File'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* FULLSCREEN DRAWING BOARD MODAL OVERLAY */}
      {isDrawingOpen && (
        <div className="fixed inset-0 bg-[#FCFAF5] z-50 flex flex-col justify-between backdrop-blur-md overflow-hidden">
          {/* Top Panel: Title & Principal Actions */}
          <div className="bg-white border-b border-[#E6DFD3] px-4 py-3 flex flex-row items-center justify-between shadow-sm flex-none select-none">
            <span className="font-extrabold text-slate-800 text-sm sm:text-base md:text-lg select-none truncate pr-2">
              {initialStatus === 'Completed and handovered' ? 'Measurement Board (Read Only)' : 'Measurement Board'}
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {initialStatus === 'Completed and handovered' ? (
                <button
                  type="button"
                  onClick={handleCancelDrawing}
                  className="h-8.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-black rounded-xl transition-colors cursor-pointer"
                >
                  Close View
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelDrawing}
                    className="h-8.5 px-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-200 text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDrawing}
                    className="h-8.5 px-4 bg-gradient-to-r from-[#DFBA6B] to-[#9E7D3B] hover:from-[#E3C277] hover:to-[#A78542] rounded-xl text-white text-xs font-black shadow-md shadow-[#9E7D3B]/20 cursor-pointer"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Center Drawing Area (Note occupies the full space) */}
          <div className="flex-grow flex-1 w-full min-h-0 flex items-center justify-center p-0 relative bg-white">
            {/* Left Page Arrow */}
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="absolute left-4 z-40 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white hover:bg-slate-50 border border-[#E6DFD3] shadow-lg flex items-center justify-center text-slate-750 disabled:opacity-20 disabled:hover:bg-white disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shrink-0 select-none cursor-pointer"
              title="Previous Page"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right Page Arrow */}
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="absolute right-4 z-40 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white hover:bg-slate-50 border border-[#E6DFD3] shadow-lg flex items-center justify-center text-slate-750 disabled:opacity-20 disabled:hover:bg-white disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shrink-0 select-none cursor-pointer"
              title="Next Page"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="relative bg-white overflow-hidden w-full h-full flex flex-col">
              {/* Pinned full-width toolbar at the top */}
              {initialStatus !== 'Completed and handovered' && (
                <div className="w-full z-40 bg-white border-b border-slate-200 px-4 py-2 sm:py-3 flex flex-row flex-wrap justify-between items-center gap-3 sm:gap-4 select-none shrink-0">
                  {/* Tool Selection Segmented Control */}
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-inner">
                    {/* Pen Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (drawMode === 'draw' && currentColor !== '#FFFFFF') {
                          setDrawMode('none');
                        } else {
                          setDrawMode('draw');
                          if (currentColor === '#FFFFFF') {
                            setCurrentColor('#1A1A1A'); // Reset from eraser to black
                          }
                        }
                      }}
                      className={`px-3 py-2 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        drawMode === 'draw' && currentColor !== '#FFFFFF'
                          ? 'bg-white text-[#9E7D3B] border border-slate-200 shadow-sm font-black scale-105'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      title="Pen Tool (Click to select/deselect)"
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                      <span className="text-[12px] sm:text-[13px] ml-2 font-black tracking-wide">Pen</span>
                    </button>

                    {/* Text Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (drawMode === 'text') {
                          setDrawMode('none');
                        } else {
                          setDrawMode('text');
                        }
                      }}
                      className={`px-3 py-2 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        drawMode === 'text'
                          ? 'bg-white text-[#9E7D3B] border border-slate-200 shadow-sm font-black scale-105'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      title="Text Tool (Click to select/deselect)"
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                      </svg>
                      <span className="text-[12px] sm:text-[13px] ml-2 font-black tracking-wide">Text</span>
                    </button>

                    {/* Eraser Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (drawMode === 'draw' && currentColor === '#FFFFFF') {
                          setDrawMode('none');
                        } else {
                          setDrawMode('draw');
                          setCurrentColor('#FFFFFF');
                        }
                      }}
                      className={`px-3 py-2 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        drawMode === 'draw' && currentColor === '#FFFFFF'
                          ? 'bg-white text-[#9E7D3B] border border-slate-200 shadow-sm font-black scale-105'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      title="Eraser Tool (Click to select/deselect)"
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                        <path d="m22 21H7" />
                        <path d="m5 11 9 9" />
                      </svg>
                      <span className="text-[12px] sm:text-[13px] ml-2 font-black tracking-wide">Eraser</span>
                    </button>

                    {/* Move / Pan Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (drawMode === 'none') {
                          setDrawMode('draw'); // Toggling Move off defaults back to Pen drawing
                          if (currentColor === '#FFFFFF') {
                            setCurrentColor('#1A1A1A');
                          }
                        } else {
                          setDrawMode('none');
                        }
                      }}
                      className={`px-3 py-2 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        drawMode === 'none'
                          ? 'bg-white text-[#9E7D3B] border border-slate-200 shadow-sm font-black scale-105'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      title="Move Mode (Click to select/deselect)"
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 10V5a2 2 0 0 0-4 0v4H13V3a2 2 0 0 0-4 0v6H8V5a2 2 0 0 0-4 0v10a7 7 0 0 0 7 7h3a7 7 0 0 0 7-7v-5a2 2 0 0 0-4 0z" />
                      </svg>
                      <span className="text-[12px] sm:text-[13px] ml-2 font-black tracking-wide">Move</span>
                    </button>
                  </div>

                  {/* Colors & Width Options Panel */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    {/* Color Palette (only clickable to select/active Pen drawing) */}
                    <div className="flex items-center gap-2">
                      {[
                        { hex: '#1A1A1A', name: 'Black' },
                        { hex: '#E53E3E', name: 'Red' },
                        { hex: '#0000FF', name: 'Blue Ink' },
                        { hex: '#38A169', name: 'Green' },
                      ].map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onPointerDown={(e) => {
                            e.preventDefault(); // Prevents input focus theft/blur
                            setCurrentColor(c.hex);
                            if (activeTextEditor) {
                              setActiveTextEditor(prev => prev ? { ...prev, color: c.hex } : null);
                            } else {
                              setDrawMode('draw');
                            }
                          }}
                          className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-slate-200 transition-all duration-200 cursor-pointer ${
                            (activeTextEditor?.color || currentColor) === c.hex
                              ? 'scale-110 ring-4 ring-[#9E7D3B]/40 border-[#9E7D3B]'
                              : 'hover:scale-105 active:scale-95'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>

                    {/* Vertical Divider */}
                    <div className="hidden sm:block w-[1px] h-8 bg-slate-200 select-none" />

                    {/* Line Width Segmented Control with visual dots */}
                    <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-inner select-none">
                      {[
                        { size: 2, label: 'Thin', dotSize: 'h-1.5 w-1.5' },
                        { size: 4, label: 'Medium', dotSize: 'h-3 w-3' },
                        { size: 7, label: 'Thick', dotSize: 'h-4.5 w-4.5' },
                      ].map((w) => (
                        <button
                          key={w.size}
                          type="button"
                          onClick={() => setCurrentWidth(w.size)}
                          className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
                            currentWidth === w.size
                              ? 'bg-white text-slate-850 shadow-sm scale-105 border border-slate-200'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title={`${w.label} Line Width`}
                        >
                          <div className={`rounded-full bg-slate-800 ${w.dotSize}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Inner wrapper container to align canvas and absolute overlays (positioned below the toolbar) */}
              <div className="relative flex-grow min-h-0 w-full bg-[#FCFAF5]">
                {/* Transition sliding page overlay */}
                {isTransitioning && prevPageSnapshot && (
                 <div className="absolute inset-0 z-30 bg-[#FCFAF5] overflow-hidden pointer-events-none flex items-center justify-center">
                   <style dangerouslySetInnerHTML={{__html: `
                     @keyframes shrinkAndExpand {
                       0% { transform: scale(1); }
                       20% { transform: scale(0.9); }
                       80% { transform: scale(0.9); }
                       100% { transform: scale(1); }
                     }
                     @keyframes slidePage-left {
                       0% { transform: translateX(0%); }
                       20% { transform: translateX(0%); }
                       80% { transform: translateX(-50%); }
                       100% { transform: translateX(-50%); }
                     }
                     @keyframes slidePage-right {
                       0% { transform: translateX(-50%); }
                       20% { transform: translateX(-50%); }
                       80% { transform: translateX(0%); }
                       100% { transform: translateX(0%); }
                     }
                   `}} />
                   <div 
                     className="w-full h-full"
                     style={{
                       animation: 'shrinkAndExpand 750ms cubic-bezier(0.25, 1, 0.5, 1) forwards',
                       transformOrigin: 'center'
                     }}
                   >
                     <div 
                       className="flex h-full w-[200%]"
                       style={
                         currentPageSnapshot 
                           ? {
                               transform: transitionDirection === 'left' ? 'translateX(0%)' : 'translateX(-50%)',
                               animation: `slidePage-${transitionDirection} 750ms cubic-bezier(0.25, 1, 0.5, 1) forwards`
                             }
                           : {
                               transform: transitionDirection === 'left' ? 'translateX(0%)' : 'translateX(-50%)'
                             }
                       }
                     >
                       <div className="w-1/2 h-full p-2 sm:p-4 flex items-center justify-center">
                         <div className="bg-white rounded-2xl border border-[#E6DFD3] shadow-2xl overflow-hidden w-full h-full">
                           <img 
                             src={transitionDirection === 'left' ? prevPageSnapshot : (currentPageSnapshot || prevPageSnapshot)} 
                             className="w-full h-full object-contain bg-white" 
                             alt="Page Transition Out"
                           />
                         </div>
                       </div>
                       <div className="w-1/2 h-full p-2 sm:p-4 flex items-center justify-center">
                         <div className="bg-white rounded-2xl border border-[#E6DFD3] shadow-2xl overflow-hidden w-full h-full">
                           <img 
                             src={transitionDirection === 'left' ? (currentPageSnapshot || prevPageSnapshot) : prevPageSnapshot} 
                             className="w-full h-full object-contain bg-white" 
                             alt="Page Transition In"
                           />
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               )}

              <canvas
                ref={canvasRef}
                width={1000}
                height={750}
                className={`w-full h-full touch-none bg-white ${
                  initialStatus === 'Completed and handovered'
                    ? 'pointer-events-none'
                    : drawMode === 'text'
                    ? 'cursor-text'
                    : drawMode === 'none'
                    ? 'cursor-grab active:cursor-grabbing'
                    : 'cursor-crosshair'
                }`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
              />

              {/* Eraser Size Vertical Slider Overlay */}
              {drawMode === 'draw' && currentColor === '#FFFFFF' && (
                <div 
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerMove={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center bg-white/95 backdrop-blur-md px-3 py-5 rounded-2xl border border-[#E6DFD3] shadow-xl gap-4 select-none animate-in fade-in slide-in-from-left-4 duration-200"
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                    Size
                  </div>
                  {/* Indicator Circle showing current thickness */}
                  <div className="h-8 w-8 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg">
                    <div
                      style={{
                        width: `${Math.max(2, Math.min(28, eraserSize * 0.4))}px`,
                        height: `${Math.max(2, Math.min(28, eraserSize * 0.4))}px`,
                      }}
                      className="bg-[#9E7D3B] rounded-full transition-all duration-100"
                    />
                  </div>
                  {/* Vertical Range Slider container */}
                  <div className="h-28 w-6 flex items-center justify-center relative">
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="1"
                      value={eraserSize}
                      onChange={(e) => setEraserSize(Number(e.target.value))}
                      className="h-1.5 w-24 cursor-pointer accent-[#9E7D3B] bg-slate-200 rounded-lg appearance-none"
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                      }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-700 font-mono select-none">
                    {eraserSize}px
                  </span>
                </div>
              )}

              {activeTextEditor && (() => {
                const pos = getTextEditorPosition();
                const canvas = canvasRef.current;
                const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
                const cssWidth = canvas ? canvas.width / dpr : 1000;
                const scaleX = cssWidth / 1000;
                const baseFontSize = Math.max(16, activeTextEditor.fontSize);
                const inputFontSize = Math.round(baseFontSize * scaleX * scale);

                // Measure text width using canvas context to fit the input exactly to the pixel
                let textWidth = 120;
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.save();
                    ctx.font = `bold ${inputFontSize}px sans-serif`;
                    textWidth = ctx.measureText(activeTextEditor.text || 'Type notes...').width;
                    ctx.restore();
                  }
                }
                
                // Add safety padding (32px) for the caret and asymmetric padding (4px left, 24px right)
                const inputWidthPx = Math.ceil(textWidth) + 32;

                return (
                  <div
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: 'translate(-5px, -50%)',
                    }}
                    className="absolute z-30 max-w-[90%] flex items-center"
                  >
                    <div className="relative group">
                      <input
                        ref={textInputRef}
                        id="whiteboard-text-input"
                        type="text"
                        value={activeTextEditor.text}
                        onChange={(e) => {
                          setActiveTextEditor(prev => prev ? { ...prev, text: e.target.value } : null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          } else if (e.key === 'Escape') {
                            setActiveTextEditor(null);
                          }
                        }}
                        onBlur={() => commitText(activeTextEditor)}
                        onDoubleClick={(e) => {
                          e.currentTarget.select(); // Highlight/select all text inside the input
                        }}
                        placeholder="Type notes..."
                        style={{
                          color: (activeTextEditor.color || currentColor) === '#FFFFFF' ? '#1A1A1A' : (activeTextEditor.color || currentColor),
                          caretColor: (activeTextEditor.color || currentColor) === '#FFFFFF' ? '#1A1A1A' : (activeTextEditor.color || currentColor),
                          fontSize: `${inputFontSize}px`,
                          width: `${inputWidthPx}px`,
                        }}
                      className="bg-transparent pl-1 pr-6 py-0.5 border border-black text-[#1A1A1A] text-sm font-semibold focus:outline-none focus:ring-0 focus:border-black rounded-none shadow-none caret-black"
                    />

                    {/* Delete button floating above the input box */}
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setActiveTextEditor(null);
                        setDrawMode('draw');
                      }}
                      className="absolute bottom-full right-0 mb-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 rounded px-2 py-0.5 text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                      title="Delete Text"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>

                    {/* Drag handle at bottom-right corner — premium pull/drag icon */}
                    <div
                      onPointerDown={handleResizePointerDown}
                      className="absolute -bottom-4 -right-4 h-11 w-11 flex items-center justify-center cursor-se-resize z-40 touch-none"
                      title="Drag to resize text"
                    >
                      <div className="h-7 w-7 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg shadow-lg flex items-center justify-center pointer-events-none ring-1 ring-white/30">
                        <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 16 16" fill="none">
                          <path d="M4 12L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M4 8V12H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 8V4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            </div> {/* Closes inner wrapper container */}
            </div> {/* Closes Note Page flex container */}
          </div> {/* Closes Center Drawing Area */}

          {/* Bottom Panel: Zoom, Navigation, and Whiteboard editing options */}
          <div className="bg-white border-t border-[#E6DFD3] px-4 py-3 flex flex-row flex-wrap items-center justify-center sm:justify-between gap-3.5 sm:gap-4 flex-none select-none w-full shadow-inner">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-full border border-slate-200 shadow-inner select-none shrink-0 scale-90 sm:scale-100">
              <button
                type="button"
                onClick={() => setScale(prev => Math.max(prev / 1.2, 0.5))}
                className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
                title="Zoom Out"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setScale(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="px-2 py-0.5 text-[9px] font-black text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all min-w-[48px] text-center cursor-pointer shadow-sm"
                title="Reset Zoom & Pan"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setScale(prev => Math.min(prev * 1.2, 5))}
                className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
                title="Zoom In"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Page Navigation Indicator */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner select-none shrink-0">
              {/* Left Arrow */}
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                title="Previous Page"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Concise Page Indicator */}
              <span className="text-xs font-black text-slate-700 px-2.5 min-w-[72px] text-center select-none">
                Page {currentPage} / {totalPages}
              </span>

              {/* Right Arrow */}
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                title="Next Page"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Plus Sign Button to Add Page */}
              {initialStatus !== 'Completed and handovered' && (
                <button
                  type="button"
                  onClick={handleAddPage}
                  className="h-8 w-8 bg-[#9E7D3B] hover:bg-[#A78542] text-white rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                  title="Add Another Page"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>

            {/* Undo & Clear Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {initialStatus !== 'Completed and handovered' && (
                <>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={strokes.length === 0}
                    className="h-9 px-3 bg-white rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 transition-colors"
                    title="Undo Stroke"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Undo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={strokes.length === 0}
                    className="h-9 px-3 bg-white rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 transition-colors"
                    title="Clear All"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Clear</span>
                  </button>
                </>
              )}
            </div>
          </div>


        </div>
      )}

      {/* Custom Modern Confirm Clear Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E6DFD3] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-6">
            
            {/* Modal Header/Icon */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Clear Sketch Canvas</h3>
                <p className="text-xs text-[#9E7D3B] font-bold uppercase tracking-wider">Warning: Permanent Action</p>
              </div>
            </div>

            {/* Body copy */}
            <p className="text-sm font-semibold text-[#1A1A1A] leading-relaxed">
              Are you sure you want to clear all drawings, sketches, and notes on <strong className="text-[#1A1A1A] font-black">Page {currentPage}</strong>? This action cannot be undone.
            </p>

            {/* Modal Action Controls */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={executeClear}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-rose-200/50"
              >
                Clear Sketch
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black rounded-xl border border-slate-200 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Search Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E6DFD3] shadow-2xl w-full max-w-lg max-h-[80vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-800">Select Category</h3>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategorySearchQuery('');
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="px-6 py-3 border-b border-slate-100 bg-[#FCFAF5]/50">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search categories (e.g. Punjabi, Saree, Dress)..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#C5A85C] focus:ring-2 focus:ring-[#C5A85C]/10 shadow-sm transition-all"
                  autoFocus
                />
                {categorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Grouped Category Options List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(() => {
                const searchLower = categorySearchQuery.toLowerCase().trim();
                let hasResults = false;

                const filteredGroups = Object.entries(CATEGORY_GROUPS).map(([groupName, options]) => {
                  const filteredOptions = options.filter(opt => 
                    opt.toLowerCase().includes(searchLower)
                  );
                  if (filteredOptions.length > 0) hasResults = true;
                  return { groupName, filteredOptions };
                });

                if (!hasResults) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-slate-400 font-medium">No matching categories found.</p>
                    </div>
                  );
                }

                return filteredGroups.map(({ groupName, filteredOptions }) => {
                  if (filteredOptions.length === 0) return null;
                  return (
                    <div key={groupName} className="space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#9E7D3B] px-1 border-b border-[#E6DFD3]/40 pb-1.5">
                        {groupName}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredOptions.map((opt) => {
                          const isSelected = category === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setCategory(opt);
                                setIsCategoryModalOpen(false);
                                setCategorySearchQuery('');
                              }}
                              className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-[#9E7D3B] border-[#9E7D3B] text-white shadow-md shadow-[#9E7D3B]/10'
                                  : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className="truncate">{opt}</span>
                              {isSelected && (
                                <svg className="h-4 w-4 text-white flex-shrink-0 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 6 9 17l-5-5" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Fullscreen Image Lightbox Modal */}
      {activeLightbox && (
        <div className="fixed inset-0 bg-black/95 z-[70] flex flex-col justify-between animate-in fade-in duration-200">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent flex-none">
            <div>
              <h4 className="text-white font-extrabold text-sm sm:text-base">{activeLightbox.title}</h4>
            </div>
            <button
              onClick={() => setActiveLightbox(null)}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-xl font-bold"
              title="Close Fullscreen View"
            >
              &times;
            </button>
          </div>

          {/* Lightbox Canvas Area */}
          <div className="flex-grow flex-1 w-full min-h-0 flex items-center justify-center px-4 relative">
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
            <div className="relative w-full h-full max-h-[75vh] max-w-4xl select-none">
              <Image
                src={activeLightbox.images[lightboxIndex]}
                alt="Large preview"
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

          {/* Lightbox Footer & Thumbnail row */}
          <div className="flex flex-col items-center gap-3 py-4 bg-gradient-to-t from-black/60 to-transparent flex-none">
            {/* Counter Label */}
            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-black tracking-widest text-white/90 uppercase select-none">
              Photo {lightboxIndex + 1} of {activeLightbox.images.length}
            </span>

            {/* Thumbnails Row */}
            {activeLightbox.images.length > 1 && (
              <div className="flex gap-2 items-center overflow-x-auto max-w-full px-4 py-1">
                {activeLightbox.images.map((thumb, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={`relative h-12 w-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      lightboxIndex === idx ? 'border-[#9E7D3B] scale-105' : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={thumb}
                      alt="thumbnail"
                      fill
                      sizes="48px"
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
