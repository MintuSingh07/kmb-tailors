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

export default function ClientForm() {
  const router = useRouter();

  // Form states
  const [clientNo, setClientNo] = useState('');
  const [dbId, setDbId] = useState('');
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [alternativeNo, setAlternativeNo] = useState('');
  const [category, setCategory] = useState('Punjabi Suit');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [suitStatus, setSuitStatus] = useState<'Pending' | 'Prepared but not handovered' | 'Completed and handovered'>('Pending');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<string[]>([]); // Base64 fabric data URLs
  const [handoverImages, setHandoverImages] = useState<string[]>([]); // Base64 handover data URLs
  const [measurementDrawing, setMeasurementDrawing] = useState<string>(''); // Base64 canvas URL fallback (Page 1)
  const [measurementDrawings, setMeasurementDrawings] = useState<string[]>([]); // Multi-page drawings
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
      
      if (isAutofillOnly) {
        setAlternativeNo('');
        setCategory('Punjabi Suit');
        setPrice('');
        setImages([]);
        setHandoverImages([]);
        setMeasurementDrawing('');
        setMeasurementDrawings([]);
        setStrokes([]);
        setTotalPages(1);
        setCurrentPage(1);
        setSuitStatus('Pending');
        setInitialStatus('Pending');
        setDbId(''); // Clear database ID so a new record is created for autofill
      } else {
        setAlternativeNo(client.alternativeNo || '');
        setCategory(client.category || 'Punjabi Suit');
        setPrice(client.price !== undefined ? String(client.price) : '');
        setImages(client.images || []);
        setHandoverImages(client.handoverImages || []);
        setMeasurementDrawing(client.measurementDrawing || '');
        setMeasurementDrawings(client.measurementDrawings || [client.measurementDrawing || '']);
        setStrokes(client.strokes || []);
        setTotalPages(Math.max(client.measurementDrawings?.length || 1, 1));
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

  // Handover image uploader handler
  const handleHandoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setHandoverImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
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
        color: currentColor === '#FFFFFF' ? '#1A1A1A' : currentColor,
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
  const resizeStartRef = useRef<{ anchorLeft: number; textLength: number } | null>(null);

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!activeTextEditor) return;
    
    const editorEl = document.getElementById('whiteboard-text-input');
    const editorRect = editorEl ? editorEl.getBoundingClientRect() : null;
    const anchorLeft = editorRect ? editorRect.left : e.clientX - 100;

    setIsResizingText(true);
    resizeStartRef.current = {
      anchorLeft,
      textLength: activeTextEditor.text.length || 10,
    };
  };

  // Global window listeners to ensure smooth, uninterrupted drag resizing on mobile/touch screens
  useEffect(() => {
    if (!isResizingText) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!resizeStartRef.current || !activeTextEditor) return;
      
      const currentWidth = e.clientX - resizeStartRef.current.anchorLeft;
      // Scale font size directly proportional to drag distance (locks cursor to text box edge!)
      const newFontSize = Math.min(
        120, 
        Math.max(12, currentWidth / (resizeStartRef.current.textLength * 0.55))
      );
      
      setActiveTextEditor(prev => prev ? { ...prev, fontSize: newFontSize } : null);
    };

    const handleGlobalPointerUp = () => {
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
        const fontSize = baseFontSize * scaleX;
        offCtx.font = `bold ${fontSize}px sans-serif`;
        
        const renderX = stroke.points[0].x * scaleX;
        const renderY = stroke.points[0].y * scaleY;
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

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.translate(panOffset.x * scaleX, panOffset.y * scaleY);
        ctx.scale(scale, scale);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const actualWidth = currentColor === '#FFFFFF' ? currentWidth * 4 : currentWidth;
        ctx.lineWidth = actualWidth * scaleX;
        ctx.strokeStyle = currentColor;

        if (currentColor === '#FFFFFF') {
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          ctx.globalCompositeOperation = 'source-over';
        }

        ctx.beginPath();
        ctx.moveTo(coords.x * scaleX, coords.y * scaleY);
        ctx.lineTo(coords.x * scaleX, coords.y * scaleY);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
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

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(panOffset.x * scaleX, panOffset.y * scaleY);
      ctx.scale(scale, scale);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const actualWidth = currentColor === '#FFFFFF' ? currentWidth * 4 : currentWidth;
      ctx.lineWidth = actualWidth * scaleX;
      ctx.strokeStyle = currentColor;

      if (currentColor === '#FFFFFF') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.beginPath();
      if (lastPoint) {
        ctx.moveTo(lastPoint.x * scaleX, lastPoint.y * scaleY);
        ctx.lineTo(coords.x * scaleX, coords.y * scaleY);
      } else {
        ctx.moveTo(coords.x * scaleX, coords.y * scaleY);
        ctx.lineTo(coords.x * scaleX, coords.y * scaleY);
      }
      ctx.stroke();
      ctx.restore();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
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

          setActiveTextEditor({
            x: strokeX,
            y: strokeY,
            canvasX: strokeToEdit.points[0].x,
            canvasY: strokeToEdit.points[0].y,
            text: strokeToEdit.text || '',
            fontSize: strokeFontSize,
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
      const actualWidth = currentColor === '#FFFFFF' ? currentWidth * 4 : currentWidth;
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

    if (suitStatus === 'Completed and handovered' && (!handoverImages || handoverImages.length === 0)) {
      setError('Please upload at least one handover photo before marking as Completed.');
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
          category,
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  disabled={initialStatus === 'Completed and handovered'}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-lg font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#C5A85C] focus:outline-none transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
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
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Uploaders and Sketch previews */}
          <div className="space-y-6">
            {/* Gallery/Camera Uploads */}
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-600 mb-2">
                Fabric / Custom Style Photos
              </label>
              
              {initialStatus === 'Completed and handovered' ? (
                // Read-only view for completed orders
                images.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {images.map((imgData, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setLightboxIndex(index);
                          setActiveLightbox({ images, title: `${name || 'Customer'} - Fabric / Design Photos` });
                        }}
                        className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-slate-100 cursor-zoom-in hover:opacity-90 transition-opacity"
                      >
                        <Image
                          src={imgData}
                          alt={`Fabric Photo ${index + 1}`}
                          fill
                          sizes="(max-width: 640px) 33vw, 25vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-400 font-medium italic">No fabric or style photos uploaded.</p>
                )
              ) : (
                // Editable view for pending/prepared orders
                <>
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
                      <svg className="h-8 w-8 text-[#9E7D3B] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                      <span className="text-sm font-bold text-slate-700">Add Fabric / Design Photos</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Upload fabric cloth photo or design references</span>
                    </label>
                  </div>

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
                            className="object-cover cursor-zoom-in hover:scale-105 transition-transform"
                            onClick={() => {
                              setLightboxIndex(index);
                              setActiveLightbox({ images, title: `${name || 'Customer'} - Fabric / Design Photos` });
                            }}
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
                </>
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
          {/* Top Panel: Action Controls */}
          <div className="bg-white border-b border-[#E6DFD3] px-3 pt-6 pb-2.5 sm:px-4 sm:pt-4 sm:pb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between shadow-sm flex-none">
            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              <span className="font-extrabold text-slate-800 text-base sm:text-lg select-none">
                {initialStatus === 'Completed and handovered' ? 'Measurement Board (Read Only)' : 'Measurement Board'}
              </span>
              
              <div className="flex items-center gap-3">
                {/* Page Navigation Controls */}
                <div className="flex items-center gap-2 bg-slate-100 p-0.5 rounded-full border border-slate-200 shadow-inner select-none scale-90 sm:scale-100 origin-right">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Previous Page"
                  >
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <span className="text-[10px] font-black text-slate-700 min-w-[60px] text-center">
                    Page {currentPage}/{totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Next Page"
                  >
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Plus Sign Button to Add Page */}
                  {initialStatus !== 'Completed and handovered' && (
                    <button
                      type="button"
                      onClick={handleAddPage}
                      className="p-1 bg-[#9E7D3B] hover:bg-[#A78542] text-white rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm flex items-center justify-center"
                      title="Add Another Page"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-full border border-slate-200 shadow-inner select-none scale-90 sm:scale-100">
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
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              {initialStatus === 'Completed and handovered' ? (
                <button
                  type="button"
                  onClick={handleCancelDrawing}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs sm:text-sm font-black rounded-lg transition-colors cursor-pointer"
                >
                  Close View
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={strokes.length === 0}
                    className="h-9 px-2.5 bg-white rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs sm:text-sm font-semibold flex items-center gap-1 shadow-sm cursor-pointer"
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
                    className="h-9 px-2.5 bg-white rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs sm:text-sm font-semibold flex items-center gap-1 shadow-sm cursor-pointer"
                    title="Clear All"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Clear</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelDrawing}
                    className="h-9 px-3 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-200 text-xs sm:text-sm font-semibold shadow-sm cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDrawing}
                    className="h-9 px-4 bg-gradient-to-r from-[#DFBA6B] to-[#9E7D3B] hover:from-[#E3C277] hover:to-[#A78542] rounded-lg text-white text-xs sm:text-sm font-black shadow-md shadow-[#9E7D3B]/20 cursor-pointer"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Center Drawing Area */}
          <div className="flex-grow flex-1 w-full min-h-0 flex items-center justify-center p-2.5 sm:p-4">
            <div className="relative bg-white rounded-2xl shadow-xl border border-[#E6DFD3] overflow-hidden w-full h-full">
              {/* Floating capsule toolbar in the top section */}
              {initialStatus !== 'Completed and handovered' && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md px-4 py-2 sm:px-6 sm:py-3 rounded-2xl sm:rounded-full border border-slate-200 shadow-xl flex flex-row flex-wrap justify-center items-center gap-3 sm:gap-4 select-none max-w-[95%]">
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
                        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v9c0 5.5 4.5 10 10 10s10-4.5 10-10V11a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2" />
                      </svg>
                      <span className="text-[12px] sm:text-[13px] ml-2 font-black tracking-wide">Move</span>
                    </button>
                  </div>

                  {/* Vertical Divider */}
                  <div className="w-[1px] h-8 bg-slate-200 select-none" />

                  {/* Color Palette (only clickable to select/active Pen drawing) */}
                  <div className="flex items-center gap-2">
                    {[
                      { hex: '#1A1A1A', name: 'Black' },
                      { hex: '#E53E3E', name: 'Red' },
                      { hex: '#3182CE', name: 'Blue' },
                      { hex: '#38A169', name: 'Green' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          setCurrentColor(c.hex);
                          setDrawMode('draw');
                        }}
                        className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-slate-200 transition-all duration-200 cursor-pointer ${
                          currentColor === c.hex && drawMode === 'draw'
                            ? 'scale-110 ring-4 ring-[#9E7D3B]/40 border-[#9E7D3B]'
                            : 'hover:scale-105 active:scale-95'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>

                  {/* Vertical Divider */}
                  <div className="w-[1px] h-8 bg-slate-200 select-none" />

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

              {activeTextEditor && (() => {
                const pos = getTextEditorPosition();
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
                        id="whiteboard-text-input"
                        type="text"
                        autoFocus
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
                        placeholder="Type notes..."
                        style={{
                          color: currentColor === '#FFFFFF' ? '#1A1A1A' : currentColor,
                          caretColor: currentColor === '#FFFFFF' ? '#1A1A1A' : currentColor,
                          fontSize: `${activeTextEditor.fontSize * scale}px`,
                          width: `${Math.max(10, activeTextEditor.text.length || 12)}ch`,
                        }}
                      className="bg-transparent px-1.5 py-0.5 border border-black text-[#1A1A1A] text-sm font-semibold focus:outline-none focus:ring-0 focus:border-black rounded-none shadow-none caret-black animate-in zoom-in-95 duration-100"
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

                    {/* Drag handle at bottom-right corner */}
                    <div
                      onPointerDown={handleResizePointerDown}
                      className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-black border border-white cursor-se-resize translate-x-1.5 translate-y-1.5 rounded-full z-40 hover:scale-125 transition-transform touch-none"
                      title="Drag to resize text"
                    />
                  </div>
                </div>
              );
            })()}
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
