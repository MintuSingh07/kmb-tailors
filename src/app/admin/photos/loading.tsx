import React from 'react';

export default function PhotosGalleryLoading() {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-[#1A1A1A] font-sans pb-24 overflow-x-hidden">
      {/* Header Skeleton */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-xl px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-6 w-32 sm:w-48 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-24 bg-slate-200 rounded-xl animate-pulse" />
      </header>

      {/* Main Content Area Skeleton */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Navigation Back Button Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-6 w-36 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-6 w-28 bg-slate-200 rounded-full animate-pulse" />
        </div>

        <div className="mb-8 space-y-2 select-none">
          <div className="h-8 w-40 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4.5 w-96 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Filter / Search Bar Skeleton */}
        <div className="h-12 w-full max-w-md bg-slate-200 rounded-2xl animate-pulse mb-8" />

        {/* Gallery Grid Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[520px]"
            >
              {/* Photo Area Skeleton */}
              <div className="flex-1 bg-slate-100 animate-pulse relative" />

              {/* Details block Skeleton */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-slate-200 rounded-md animate-pulse" />
                    <div className="h-4 w-20 bg-slate-100 rounded-md animate-pulse" />
                  </div>
                  <div className="h-5 w-16 bg-slate-200 rounded-md animate-pulse" />
                </div>
                <div className="flex justify-between items-center pt-3.5 border-t border-slate-50">
                  <div className="h-8 w-24 bg-slate-200 rounded-full animate-pulse" />
                  <div className="h-8 w-24 bg-slate-200 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
