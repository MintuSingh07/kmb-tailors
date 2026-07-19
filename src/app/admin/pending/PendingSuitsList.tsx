'use client';

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
  handoverImages?: string[];
  suitStatus?: string;
  measurementDrawing: string;
  price: number;
  updatedAt: string;
}

export default function PendingSuitsList({ initialSuits }: { initialSuits: ClientRecord[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
      {initialSuits.map((client) => {
        const isCompleted = client.suitStatus === 'Completed and handovered';
        
        let primaryImage: string | null = null;
        let placeholderText = 'No Style Photo';

        if (isCompleted) {
          if (client.handoverImages && client.handoverImages.length > 0) {
            primaryImage = client.handoverImages[0];
          } else if (client.images && client.images.length > 0) {
            primaryImage = client.images[0];
          } else {
            placeholderText = 'No Handover Photo';
          }
        } else {
          if (client.images && client.images.length > 0) {
            primaryImage = client.images[0];
          }
        }

        return (
          <div
            key={client._id}
            className="bg-white border border-[#E6DFD3] rounded-2xl shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between overflow-hidden group w-full max-w-sm mx-auto"
          >
            {/* Clickable Card Header & Body */}
            <Link
              href={`/admin/new?id=${client._id}`}
              className="flex-1 flex flex-col cursor-pointer"
              title="Click card to edit profile details"
            >
              {/* Card Cover Image */}
              {primaryImage ? (
                <div className="relative aspect-[4/5] w-full bg-slate-100 select-none border-b border-[#E6DFD3]/40 overflow-hidden">
                  <Image
                    src={primaryImage}
                    alt={`${client.name} Style`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-[4/5] w-full bg-gradient-to-br from-[#FCFAF5] to-[#E6DFD3] flex flex-col items-center justify-center select-none border-b border-[#E6DFD3]/40">
                  <div className="relative h-12 w-12 opacity-30 mb-2">
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      fill
                      sizes="48px"
                      className="object-contain filter grayscale"
                    />
                  </div>
                  <span className="text-slate-400 text-xs font-black tracking-widest uppercase">
                    {placeholderText}
                  </span>
                </div>
              )}

              {/* Card Body */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-black text-slate-800 truncate leading-snug group-hover:text-[#9E7D3B] transition-colors">
                      {client.name}
                    </h2>
                    <span className="inline-block text-[#9E7D3B] bg-[#9E7D3B]/10 border border-[#E6DFD3] rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider mt-1 select-none">
                      {client.category}
                    </span>
                  </div>
                  <span className="text-[#9E7D3B] bg-[#FCFAF5] border border-[#E6DFD3] rounded-lg px-2 py-0.5 text-[10px] font-black tracking-wider select-none shrink-0">
                    {client.clientNo}
                  </span>
                </div>

                {/* Contact Number & Price */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600 text-xs sm:text-sm">
                      <svg className="h-4 w-4 text-[#9E7D3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-bold">
                        {client.contactNo}
                      </span>
                    </div>
                    <span className="text-slate-800 font-extrabold text-xs sm:text-sm">
                      Rs. {client.price !== undefined ? client.price.toLocaleString('en-IN') : '8,500'}
                    </span>
                  </div>
                  {client.alternativeNo && (
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <span className="w-4 text-center font-bold text-[#9E7D3B] text-[9px] uppercase">Alt</span>
                      <span className="font-semibold">
                        {client.alternativeNo}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Card Footer */}
            <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50/50">
              <Link
                href={`/admin/pending/measurement?id=${client._id}`}
                className="px-4 py-2 border border-[#E6DFD3] hover:border-[#9E7D3B] bg-white hover:bg-[#FCFAF5] text-slate-700 hover:text-[#9E7D3B] text-[10px] font-black rounded-full transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] select-none text-center cursor-pointer inline-block tracking-wider"
              >
                Measurement
              </Link>
              
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider select-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Click card to edit &rarr;
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
