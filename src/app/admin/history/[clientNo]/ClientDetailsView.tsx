'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Ruler } from 'lucide-react';

interface ClientRecord {
  _id: any;
  clientNo: string;
  name: string;
  contactNo: string;
  alternativeNo?: string;
  category: string;
  suitQuantity?: string;
  price: number;
  suitStatus: string;
  images: string[];
  handoverImages: string[];
  measurementDrawing?: string;
  measurementDrawings?: string[];
  address?: string;
  strokes?: any[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ClientDetailsViewProps {
  clientRecords: ClientRecord[];
  profile: ClientRecord;
  username: string;
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'Completed and handovered':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    case 'Prepared but not handovered':
      return 'bg-amber-50 border-amber-200 text-amber-700';
    default:
      return 'bg-blue-50 border-blue-200 text-blue-700';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'Completed and handovered':
      return 'Completed & Delivered';
    case 'Prepared but not handovered':
      return 'Ready for Delivery';
    default:
      return 'Pending';
  }
}

export default function ClientDetailsView({ clientRecords, profile, username }: ClientDetailsViewProps) {
  // Modal states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<string>('');
  const [selectedImageRecord, setSelectedImageRecord] = useState<ClientRecord | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Load image dimensions dynamically
  useEffect(() => {
    if (!selectedImage) return;
    setDimensions(null);
    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = selectedImage;
  }, [selectedImage]);

  // Calculate file size from base64 string length
  const getFileSize = (src: string) => {
    if (src.startsWith('data:')) {
      const base64Content = src.split(',')[1];
      if (base64Content) {
        const bytes = base64Content.length * 0.75;
        if (bytes > 1024 * 1024) {
          return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
        return (bytes / 1024).toFixed(1) + ' KB';
      }
    }
    return 'Remote Web Resource';
  };

  // Extract file MIME type/format
  const getFormat = (src: string) => {
    if (src.startsWith('data:')) {
      const match = src.match(/data:image\/([a-zA-Z+]+);/);
      return match ? match[1].toUpperCase() : 'IMAGE';
    }
    return 'URL RESOURCE';
  };

  // Calculate stats
  const totalOrders = clientRecords.length;
  const totalEarnings = clientRecords.reduce((sum, q) => sum + (q.price || 0), 0);

  return (
    <div className="min-h-screen bg-[#FCFAF5] flex flex-col font-sans">
      {/* Top Banner section */}
      <header className="bg-white border-b border-[#E6DFD3] py-4.5 px-6 sm:px-12 flex items-center justify-between shadow-sm select-none">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 select-none">
            <NextImage
              src="/logo.png"
              alt="KMB Boutique Logo"
              fill
              sizes="(max-width: 640px) 40px, 48px"
              priority
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">
              KMB Boutique
            </h1>
            <span className="text-[10px] text-[#9E7D3B] font-black uppercase tracking-wider mt-1 block">
              Luxury Stitching Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-extrabold">
            Logged as, <strong className="text-slate-800 uppercase font-black">{username}</strong>
          </span>
          <button
            onClick={() => {
              // Sign out flow
              document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              window.location.href = '/login';
            }}
            className="px-4 py-2 border border-[#E6DFD3] hover:border-slate-800 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-black rounded-xl transition-all shadow-sm bg-white"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container - Full Horizontal Width */}
      <main className="flex-grow w-full px-6 sm:px-12 py-8 sm:py-12 space-y-12">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/admin/history"
            className="inline-flex items-center gap-2 text-[#9E7D3B] hover:text-[#A78542] text-sm sm:text-base font-black transition-all hover:scale-[1.01]"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Client History
          </Link>
        </div>

        {/* Customer Details Luxury Card */}
        <div className="bg-white border border-[#E6DFD3] rounded-[32px] shadow-sm p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 relative overflow-hidden">
          {/* Decorative subtle gold accent ribbon on the side */}
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#DFBA6B] to-[#9E7D3B]" />

          {/* Left Block: Avatar + Name + Client Code */}
          <div className="flex items-center gap-4 select-none">
            {/* Initials Avatar Badge */}
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#DFBA6B] to-[#9E7D3B] text-white flex items-center justify-center text-2xl font-black shadow-md shadow-[#9E7D3B]/20 shrink-0 border border-[#DFBA6B]/30">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <span className="text-[10px] font-black text-[#9E7D3B] uppercase tracking-widest block mb-1">
                Customer Profile File
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                {profile.name || 'N/A'}
              </h2>
              <span className="inline-block mt-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Code: <strong className="text-[#9E7D3B] font-black">{profile.clientNo}</strong>
              </span>
            </div>
          </div>

          {/* Right Block: Symmetrical Grid for remaining 4 attributes */}
          <div className="w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-100 lg:pl-8 flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              {/* Attribute 1: Contact Number */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">
                  Contact Number
                </span>
                <span className="text-base sm:text-lg font-black text-slate-800 mt-1 block leading-none">
                  {profile.contactNo || 'N/A'}
                </span>
              </div>

              {/* Attribute 2: Alternative Number */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">
                  Alternative Number
                </span>
                <span className="text-base sm:text-lg font-black text-slate-800 mt-1 block leading-none">
                  {profile.alternativeNo || 'N/A'}
                </span>
              </div>

              {/* Attribute 3: Total Orders */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">
                  Total Orders
                </span>
                <span className="text-base sm:text-lg font-black text-slate-800 mt-1 block leading-none">
                  {totalOrders} {totalOrders === 1 ? 'Suit' : 'Suits'}
                </span>
              </div>

              {/* Attribute 4: Total Earnings */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">
                  Total Earnings
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-600 mt-1 block leading-none">
                  Rs. {totalEarnings.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {profile.address && (
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-1.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">
                    Address
                  </span>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    {profile.address}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Queries / Measurements List Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Suit Queries & Measurements
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">
              Complete history of order details, design fabrics, and measurement sketches
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-10">
            {clientRecords.map((q) => {
              const fabricImg = q.images && q.images.length > 0 ? q.images[0] : null;
              const completedImg = q.handoverImages && q.handoverImages.length > 0 ? q.handoverImages[0] : null;
              const sketchImg = q.measurementDrawing || (q.measurementDrawings && q.measurementDrawings.length > 0 ? q.measurementDrawings[0] : null);
              const orderId = q._id ? `#${q._id.toString().substring(18).toUpperCase()}` : 'N/A';

              return (
                <div
                  key={q._id.toString()}
                  className="bg-white border border-[#E6DFD3] rounded-[32px] shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  {/* Card Banner showing images: Fabric, Outfit & Measurement Sketch */}
                  <div className="grid grid-cols-3 h-72 sm:h-80 lg:h-96 bg-slate-50 border-b border-[#E6DFD3] select-none overflow-hidden relative">
                    {/* Column 1: Fabric Image */}
                    {fabricImg ? (
                      <div
                        onClick={() => {
                          setSelectedImage(fabricImg);
                          setSelectedImageType('Fabric Design Sample');
                          setSelectedImageRecord(q);
                        }}
                        className="relative w-full h-full border-r border-[#E6DFD3] overflow-hidden bg-slate-100 cursor-zoom-in group/fabric"
                      >
                        <img
                          src={fabricImg}
                          alt="Fabric Design"
                          className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-r border-[#E6DFD3] text-slate-400 shrink-0">
                        <svg className="h-6 w-6 sm:h-7 sm:w-7 text-slate-300 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21m0 0-.813-5.096M9 21h3.75m-6.375-3A3.75 3.75 0 1 1 9 14.25" />
                        </svg>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-455">No Fabric</span>
                      </div>
                    )}

                    {/* Column 2: Completed Suit Image */}
                    {completedImg ? (
                      <div
                        onClick={() => {
                          setSelectedImage(completedImg);
                          setSelectedImageType('Completed Outfit Handover');
                          setSelectedImageRecord(q);
                        }}
                        className="relative w-full h-full border-r border-[#E6DFD3] overflow-hidden bg-slate-100 cursor-zoom-in group/outfit"
                      >
                        <img
                          src={completedImg}
                          alt="Completed Outfit"
                          className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-r border-[#E6DFD3] text-slate-400 shrink-0">
                        <svg className="h-6 w-6 sm:h-7 sm:w-7 text-slate-300 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-455">No Outfit</span>
                      </div>
                    )}

                    {/* Column 3: Measurement Sketch Image */}
                    {sketchImg ? (
                      <div
                        onClick={() => {
                          setSelectedImage(sketchImg);
                          setSelectedImageType('Measurement Whiteboard Sketch');
                          setSelectedImageRecord(q);
                        }}
                        className="relative w-full h-full overflow-hidden bg-white cursor-zoom-in group/sketch"
                      >
                        <img
                          src={sketchImg}
                          alt="Measurement Sketch"
                          className="w-full h-full object-contain p-2 transition-transform duration-350 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 shrink-0">
                        <svg className="h-6 w-6 sm:h-7 sm:w-7 text-slate-300 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-455">No Sketch</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content details */}
                  <div className="p-8 sm:p-10 flex flex-col flex-1 justify-between gap-6">
                    <div className="space-y-6">
                      {/* Top Row: Category Title, Status Badge, Order ID */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-black text-slate-800 text-2xl sm:text-3xl tracking-tight leading-tight">
                            {q.category}
                          </h4>
                          <span className={`inline-block border rounded-full px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider select-none shrink-0 ${getStatusStyles(q.suitStatus)}`}>
                            {getStatusLabel(q.suitStatus)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[10px] font-extrabold text-[#9E7D3B] uppercase tracking-wider px-2 py-0.5 bg-[#DFBA6B]/10 rounded border border-[#DFBA6B]/20">
                            Order: {orderId}
                          </span>
                        </div>
                      </div>

                      {/* Info lines grid */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm select-none border-t border-slate-100 pt-5">
                        {/* Price Details */}
                        <div>
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-xs block">Stitching Price</span>
                          {q.price && q.price > 0 ? (
                            <span className="text-base sm:text-lg font-black text-slate-800 block mt-1">
                              Rs. {q.price.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-slate-400 italic block mt-1">
                              Pending Estimation
                            </span>
                          )}
                        </div>

                        {/* Registered Date & Time */}
                        <div>
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-xs block">Registration Timestamp</span>
                          <span className="text-slate-600 font-bold block mt-1 leading-tight">
                            {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                              at {new Date(q.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </span>
                        </div>

                        {/* Customer Contacts */}
                        <div>
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-xs block">Primary Contact</span>
                          <span className="text-slate-600 font-bold block mt-1">
                            {q.contactNo || 'N/A'}
                          </span>
                        </div>

                        {/* Alt Contact */}
                        <div>
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-xs block">Alternative Contact</span>
                          <span className="text-slate-600 font-bold block mt-1">
                            {q.alternativeNo || 'N/A'}
                          </span>
                        </div>

                        {/* Quantity of Suits */}
                        <div>
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-xs block">Quantity of Suits</span>
                          <span className="text-slate-700 font-black block mt-1">
                            {q.suitQuantity || '1 Suit'}
                          </span>
                        </div>

                        {/* Handover Count */}
                        <div>
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-xs block">Handover Uploads</span>
                          <span className="text-slate-600 font-bold block mt-1">
                            {q.handoverImages ? q.handoverImages.length : 0} {q.handoverImages && q.handoverImages.length === 1 ? 'Photo' : 'Photos'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-5 border-t border-slate-100 select-none">
                      <Link
                        href={`/admin/new?id=${q._id}&draw=true`}
                        className="w-full sm:flex-1 text-center py-3.5 border border-[#E6DFD3] hover:border-[#9E7D3B] hover:bg-[#9E7D3B]/5 text-slate-700 hover:text-[#9E7D3B] text-xs sm:text-sm font-black rounded-2xl transition-all duration-150 cursor-pointer shadow-sm bg-white inline-flex items-center justify-center gap-2"
                      >
                        <Ruler className="h-4.5 w-4.5 shrink-0" strokeWidth={2.5} />
                        Measurement
                      </Link>
                      <Link
                        href={`/admin/new?id=${q._id}`}
                        className="w-full sm:flex-1 text-center py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black rounded-2xl transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
                      >
                        <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Image Preview Modal Overlay */}
      {selectedImage && selectedImageRecord && (
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 transition-all duration-300 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          {/* Modal Card content */}
          <div
            className="bg-white border border-[#E6DFD3] rounded-[32px] overflow-hidden shadow-2xl max-w-5xl w-full flex flex-col md:flex-row h-[85vh] max-h-[850px] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left side: Large Image view */}
            <div className="flex-grow bg-slate-50 border-r border-[#E6DFD3] flex items-center justify-center p-6 relative overflow-hidden select-none">
              <img
                src={selectedImage}
                alt={selectedImageType}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-md hover:scale-[1.01] transition-transform duration-300"
              />
            </div>

            {/* Right side: Sleek sidebar details panel */}
            <div className="w-full md:w-80 shrink-0 p-8 flex flex-col justify-between bg-white text-slate-800 space-y-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2 select-none">
                  <span className="text-[10px] font-black text-[#9E7D3B] uppercase tracking-widest block">
                    {selectedImageType}
                  </span>
                  <h3 className="text-2xl font-black text-slate-850 tracking-tight leading-tight">
                    {selectedImageRecord.category}
                  </h3>
                  <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${getStatusStyles(selectedImageRecord.suitStatus)}`}>
                    {getStatusLabel(selectedImageRecord.suitStatus)}
                  </span>
                </div>

                {/* Technical metadata list */}
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                    Image File Details
                  </h4>
                  
                  <div className="space-y-3.5 text-sm select-none">
                    {/* Size */}
                    <div>
                      <span className="text-xs text-slate-400 font-bold block">Approx File Size</span>
                      <span className="font-bold text-slate-700 block mt-0.5">
                        {getFileSize(selectedImage)}
                      </span>
                    </div>

                    {/* Dimensions */}
                    <div>
                      <span className="text-xs text-slate-400 font-bold block">Resolution</span>
                      <span className="font-bold text-slate-700 block mt-0.5">
                        {dimensions ? `${dimensions.width} x ${dimensions.height} px` : 'Loading...'}
                      </span>
                    </div>

                    {/* Format */}
                    <div>
                      <span className="text-xs text-slate-400 font-bold block">Image Format</span>
                      <span className="font-bold text-slate-700 block mt-0.5">
                        {getFormat(selectedImage)}
                      </span>
                    </div>

                    {/* Last Uploaded Time */}
                    <div>
                      <span className="text-xs text-slate-400 font-bold block">Upload Date & Time</span>
                      <span className="font-bold text-slate-700 block mt-0.5 leading-tight">
                        {new Date(selectedImageRecord.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          at {new Date(selectedImageRecord.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close controls button */}
              <div className="pt-5 border-t border-slate-100 select-none">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="w-full text-center py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black rounded-2xl transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-1.5"
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
