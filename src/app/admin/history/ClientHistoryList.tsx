'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getGroupForCategory } from '../../../lib/categories';

interface ClientRecord {
  _id: string;
  clientNo: string;
  name: string;
  contactNo: string;
  alternativeNo?: string;
  category: string;
  images: string[];
  measurementDrawing: string;
  price: number;
  updatedAt: string;
}

export default function ClientHistoryList({ initialClients }: { initialClients: ClientRecord[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Available category groups
  const categories = ['All', 'Suits', 'Sarees', 'Dresses', 'Kurtis & Kurtas', 'Lehengas', 'Blouses', 'Bottom Wear'];

  // Count items per category group dynamically
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = { All: initialClients.length };
    categories.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = initialClients.filter((c) => getGroupForCategory(c.category) === cat).length;
      }
    });
    return counts;
  }, [initialClients]);

  // Color coding styles helper
  const getCategoryStyles = (category: string) => {
    const group = getGroupForCategory(category);
    switch (group) {
      case 'Suits':
        return 'text-[#9E7D3B] bg-[#9E7D3B]/10 border-[#E6DFD3]';
      case 'Sarees':
        return 'text-rose-700 bg-rose-50 border-rose-200/60';
      case 'Dresses':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200/60';
      case 'Kurtis & Kurtas':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200/60';
      case 'Lehengas':
        return 'text-violet-700 bg-violet-50 border-violet-200/60';
      case 'Blouses':
        return 'text-blue-700 bg-blue-50 border-blue-200/60';
      case 'Bottom Wear':
        return 'text-amber-700 bg-amber-50 border-amber-200/60';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const filteredClients = useMemo(() => {
    return initialClients.filter((client) => {
      const matchesCategory = selectedCategory === 'All' || getGroupForCategory(client.category) === selectedCategory;
      const cleanQuery = searchQuery.toLowerCase().trim();
      const matchesSearch =
        cleanQuery === '' ||
        client.name.toLowerCase().includes(cleanQuery) ||
        client.clientNo.toLowerCase().includes(cleanQuery) ||
        client.contactNo.includes(cleanQuery) ||
        (client.alternativeNo && client.alternativeNo.includes(cleanQuery));

      return matchesCategory && matchesSearch;
    });
  }, [initialClients, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Search & Filtering Control Bar */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between bg-white border border-[#E6DFD3] rounded-3xl p-5 shadow-sm select-none">
        
        {/* Real-time search */}
        <div className="relative flex-1 max-w-lg w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, client code, or phone number..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#E6DFD3] bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#9E7D3B] focus:ring-2 focus:ring-[#9E7D3B]/10 font-bold text-sm shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Dynamic Category Pill Filters */}
        <div className="flex flex-wrap gap-2 items-center overflow-x-auto py-1 scrollbar-none">
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 text-xs font-black rounded-full border transition-all cursor-pointer select-none whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#9E7D3B] border-[#9E7D3B] text-white shadow-md shadow-[#9E7D3B]/15 scale-[1.02]'
                    : 'bg-[#FCFAF5] border-[#E6DFD3] text-slate-600 hover:border-slate-400'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Database Table view for Desktop & Tablet */}
      {filteredClients.length === 0 ? (
        <div className="text-center rounded-3xl border border-[#E6DFD3] bg-[#FCFAF5] p-12 max-w-xl mx-auto shadow-sm select-none">
          <svg className="h-12 w-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="font-extrabold text-slate-800 text-lg mb-1">No matches found</h3>
          <p className="text-slate-500 font-semibold text-sm">
            We couldn&apos;t find any records matching search criteria or category filter. Try clearing query filters.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white border border-[#E6DFD3] rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-sm font-extrabold text-slate-500 tracking-wider select-none uppercase">
                  <th className="py-5 px-6 w-24 text-center">Style cover</th>
                  <th className="py-5 px-6">Customer Details</th>
                  <th className="py-5 px-6 w-36">Client Code</th>
                  <th className="py-5 px-6 w-40">Category</th>
                  <th className="py-5 px-6 w-40">Stitching Price</th>
                  <th className="py-5 px-6 w-48">Contact Number</th>
                  <th className="py-5 px-6 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const hasImage = client.images && client.images.length > 0;
                  const primaryImage = hasImage ? client.images[0] : null;

                  return (
                    <tr
                      key={client._id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    >
                      {/* Thumbnail photo - Larger & More visible */}
                      <td className="py-5.5 px-6 text-center select-none">
                        <Link href={`/admin/new?code=${encodeURIComponent(client.clientNo)}`} className="block">
                          {primaryImage ? (
                            <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-slate-200 mx-auto bg-slate-100 shadow-sm shrink-0">
                              <Image
                                src={primaryImage}
                                alt={client.name}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-14 w-14 rounded-xl border border-[#E6DFD3] mx-auto bg-[#FCFAF5] flex items-center justify-center text-[10px] font-black text-slate-400 tracking-widest shrink-0 uppercase">
                              No Pic
                            </div>
                          )}
                        </Link>
                      </td>

                      {/* Customer Name - Larger & More visible */}
                      <td className="py-5.5 px-6">
                        <Link href={`/admin/new?code=${encodeURIComponent(client.clientNo)}`} className="block">
                          <span className="font-black text-slate-800 group-hover:text-[#9E7D3B] text-lg sm:text-xl transition-colors truncate block max-w-xs leading-snug">
                            {client.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-extrabold block uppercase tracking-wider mt-1 select-none">
                            Updated {new Date(client.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </Link>
                      </td>

                      {/* Client Code - Larger & More visible */}
                      <td className="py-5.5 px-6 font-black text-slate-700 text-base select-none">
                        <Link href={`/admin/new?code=${encodeURIComponent(client.clientNo)}`} className="block">
                          {client.clientNo}
                        </Link>
                      </td>

                      {/* Category Badge - Larger & More visible */}
                      <td className="py-5.5 px-6 select-none">
                        <Link href={`/admin/new?code=${encodeURIComponent(client.clientNo)}`} className="block">
                          <span className={`inline-block border rounded-full px-3 py-1 text-xs sm:text-sm font-black uppercase tracking-wider ${getCategoryStyles(client.category)}`}>
                            {client.category}
                          </span>
                        </Link>
                      </td>

                      {/* Price - Larger & More visible */}
                      <td className="py-5.5 px-6 select-none">
                        <Link href={`/admin/new?code=${encodeURIComponent(client.clientNo)}`} className="block">
                          <span className="font-black text-slate-900 text-base">
                            Rs. {client.price !== undefined ? client.price.toLocaleString('en-IN') : '0'}
                          </span>
                        </Link>
                      </td>

                      {/* Phone - Larger & More visible */}
                      <td className="py-5.5 px-6 font-extrabold text-slate-700 hover:text-[#9E7D3B] text-base transition-colors">
                        <a href={`tel:${client.contactNo}`} className="inline-flex items-center gap-2 hover:underline">
                          <svg className="h-4.5 w-4.5 text-[#9E7D3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {client.contactNo}
                        </a>
                      </td>

                      {/* Measurement button */}
                      <td className="py-5.5 px-6 text-right select-none">
                        <Link
                          href={`/admin/pending/measurement?code=${encodeURIComponent(client.clientNo)}`}
                          className="px-5 py-2 border border-[#E6DFD3] hover:border-[#9E7D3B] bg-white hover:bg-[#FCFAF5] text-slate-700 hover:text-[#9E7D3B] text-xs font-black rounded-full transition-all shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.97] select-none text-center cursor-pointer inline-block tracking-wider"
                        >
                          Measurement
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Compact Card List View - Larger & More visible */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredClients.map((client) => {
              const hasImage = client.images && client.images.length > 0;
              const primaryImage = hasImage ? client.images[0] : null;

              return (
                <div
                  key={client._id}
                  className="bg-white border border-[#E6DFD3] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <Link
                    href={`/admin/new?code=${encodeURIComponent(client.clientNo)}`}
                    className="flex-1 flex gap-5 items-start cursor-pointer mb-5"
                  >
                    {/* Tiny cover thumbnail */}
                    {primaryImage ? (
                      <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm shrink-0">
                        <Image
                          src={primaryImage}
                          alt={client.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-2xl border border-[#E6DFD3] bg-[#FCFAF5] flex flex-col items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 select-none">
                        <span>No image</span>
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-block border rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider select-none ${getCategoryStyles(client.category)}`}>
                          {client.category}
                        </span>
                        <span className="text-slate-500 font-extrabold text-sm">
                          {client.clientNo}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-800 text-xl group-hover:text-[#9E7D3B] transition-colors truncate mt-1.5 leading-snug">
                        {client.name}
                      </h3>
                      <div className="flex items-center justify-between text-sm sm:text-base font-black text-slate-700 mt-3 border-t border-slate-100 pt-2.5 select-none">
                        <span className="text-slate-900">Rs. {client.price !== undefined ? client.price.toLocaleString('en-IN') : '0'}</span>
                        <span className="text-slate-500">{client.contactNo}</span>
                      </div>
                    </div>
                  </Link>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 bg-slate-50/50 -mx-6 -mb-6 px-6 py-4 rounded-b-3xl select-none">
                    <Link
                      href={`/admin/pending/measurement?code=${encodeURIComponent(client.clientNo)}`}
                      className="px-5 py-2 border border-[#E6DFD3] hover:border-[#9E7D3B] bg-white hover:bg-[#FCFAF5] text-slate-700 hover:text-[#9E7D3B] text-xs font-black rounded-full transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] select-none text-center cursor-pointer inline-block tracking-wider"
                    >
                      Measurement
                    </Link>
                    <span className="text-xs text-slate-400 font-black uppercase tracking-wider">
                      Tap card to edit &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
