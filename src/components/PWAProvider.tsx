'use client';

import { useEffect, useState } from 'react';
import { getOptimizedImageUrl } from '../lib/imageUtils';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [precacheStatus, setPrecacheStatus] = useState<string | null>(null);

  useEffect(() => {
    // Set initial online/offline state
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered successfully:', reg.scope);

          // Once registered and online, trigger background pre-caching of all client data & photos
          if (navigator.onLine) {
            preloadAllData(reg);
          }
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pre-fetch all client records & images into local CacheStorage for offline visibility
  const preloadAllData = async (swRegistration?: ServiceWorkerRegistration) => {
    try {
      setPrecacheStatus('Syncing offline data...');
      
      // Fetch all client records from server
      const res = await fetch('/api/clients/all');
      if (!res.ok) return;

      const clients = await res.json();
      if (!Array.isArray(clients)) return;

      // Extract all image URLs (fabric photos, handover photos, whiteboard drawings)
      const imageUrlsSet = new Set<string>();

      clients.forEach((client: any) => {
        // Store client details in localStorage for offline fallback
        try {
          if (client._id) localStorage.setItem(`kmb_client_${client._id}`, JSON.stringify(client));
          if (client.clientNo) localStorage.setItem(`kmb_client_${client.clientNo}`, JSON.stringify(client));
        } catch (e) {}

        if (client.images && Array.isArray(client.images)) {
          client.images.forEach((url: string) => {
            if (url) {
              imageUrlsSet.add(url);
              imageUrlsSet.add(getOptimizedImageUrl(url, 600));
            }
          });
        }
        if (client.handoverImages && Array.isArray(client.handoverImages)) {
          client.handoverImages.forEach((url: string) => {
            if (url) {
              imageUrlsSet.add(url);
              imageUrlsSet.add(getOptimizedImageUrl(url, 600));
            }
          });
        }
        if (client.measurementDrawing) {
          imageUrlsSet.add(client.measurementDrawing);
        }
        if (client.measurementDrawings && Array.isArray(client.measurementDrawings)) {
          client.measurementDrawings.forEach((url: string) => url && imageUrlsSet.add(url));
        }
      });

      const imageUrls = Array.from(imageUrlsSet);

      // Also cache individual client API endpoints in kmb-data-v2 CacheStorage
      if ('caches' in window) {
        const cache = await caches.open('kmb-data-v2');
        clients.forEach((c: any) => {
          if (c._id) {
            const clientUrl = `/api/clients/${c._id}?by=id`;
            const blobResponse = new Response(JSON.stringify(c), {
              headers: { 'Content-Type': 'application/json' },
            });
            cache.put(clientUrl, blobResponse).catch(() => {});
          }
          if (c.clientNo) {
            const clientNoUrl = `/api/clients/${c.clientNo}`;
            const blobResponse = new Response(JSON.stringify(c), {
              headers: { 'Content-Type': 'application/json' },
            });
            cache.put(clientNoUrl, blobResponse).catch(() => {});
          }
        });
      }

      // Send image URLs to Service Worker for background caching
      const activeWorker = swRegistration?.active || navigator.serviceWorker.controller;
      if (activeWorker && imageUrls.length > 0) {
        activeWorker.postMessage({
          type: 'PRECACHE_RESOURCES',
          urls: imageUrls,
        });
      }

      setPrecacheStatus(null);
      console.log(`[PWA Offline Sync] Successfully pre-cached ${clients.length} clients and ${imageUrls.length} images.`);
    } catch (err) {
      console.warn('[PWA Offline Sync] Error during background pre-caching:', err);
      setPrecacheStatus(null);
    }
  };

  return (
    <>
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs sm:text-sm font-black py-2.5 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-md animate-in fade-in select-none">
          <svg className="h-4.5 w-4.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Offline Mode: Browsing Pre-loaded Measurements & Images</span>
        </div>
      )}

      {children}
    </>
  );
}
