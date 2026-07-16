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
  const [clients, setClients] = useState(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState<{ clientNo: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const triggerDeleteConfirm = (clientNo: string, clientName: string) => {
    setDeleteError('');
    setDeleteConfirm({ clientNo, name: clientName });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    setDeleteError('');

    try {
      const response = await fetch(`/api/clients/${encodeURIComponent(deleteConfirm.clientNo)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete client');
      }

      setClients((prev) => prev.filter((c) => c.clientNo !== deleteConfirm.clientNo));
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      setDeleteError(error.message || 'An error occurred while deleting');
    } finally {
      setDeleting(false);
    }
  };

  // Available category groups
  const categories = ['All', 'Suits', 'Sarees', 'Dresses', 'Kurtis & Kurtas', 'Lehengas', 'Blouses', 'Bottom Wear'];

  // Count items per category group dynamically
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = { All: clients.length };
    categories.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = clients.filter((c) => getGroupForCategory(c.category) === cat).length;
      }
    });
    return counts;
  }, [clients]);

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
    return clients.filter((client) => {
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
  }, [clients, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Search & Filtering Control Bar */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between bg-white border border-[#E6DFD3] rounded-3xl p-5 shadow-sm select-none">
        
        {/* Real-time search */}
        <div className="relative flex-1 max-w-lg w-full">
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
            placeholder="Search by customer name, client code, or phone number..."
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
                          <svg className="h-4.5 w-4.5 text-[#9E7D3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          {client.contactNo}
                        </a>
                      </td>

                      {/* Actions */}
                      <td className="py-5.5 px-6 text-right select-none">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/pending/measurement?code=${encodeURIComponent(client.clientNo)}`}
                            className="px-5 py-2 border border-[#E6DFD3] hover:border-[#9E7D3B] bg-white hover:bg-[#FCFAF5] text-slate-700 hover:text-[#9E7D3B] text-xs font-black rounded-full transition-all shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.97] select-none text-center cursor-pointer inline-block tracking-wider"
                          >
                            Measurement
                          </Link>
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               triggerDeleteConfirm(client.clientNo, client.name);
                             }}
                             className="p-2 border border-rose-200 hover:border-rose-400 bg-white hover:bg-rose-50 text-rose-600 rounded-full transition-all shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.97] cursor-pointer inline-flex items-center justify-center"
                             title="Delete Client"
                           >
                            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
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
                     <button
                       type="button"
                       onClick={(e) => {
                         e.stopPropagation();
                         triggerDeleteConfirm(client.clientNo, client.name);
                       }}
                       className="px-4 py-2 border border-rose-200 hover:border-rose-400 bg-white hover:bg-rose-50 text-rose-600 text-xs font-black rounded-full transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5"
                     >
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Custom Modern Confirm Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E6DFD3] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-6">
            
            {/* Modal Header/Icon */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Delete Customer Profile</h3>
                <p className="text-xs text-[#9E7D3B] font-bold uppercase tracking-wider">Warning: Permanent Action</p>
              </div>
            </div>

            {/* Error messaging */}
            {deleteError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-100">
                {deleteError}
              </div>
            )}

            {/* Body copy */}
            <p className="text-sm font-semibold text-[#1A1A1A] leading-relaxed">
              Are you sure you want to delete all records for <strong className="text-[#1A1A1A] font-black">"{deleteConfirm.name}" ({deleteConfirm.clientNo})</strong>? This action cannot be undone and will delete all measurements.
            </p>

            {/* Modal Action Controls */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={executeDelete}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-rose-200/50"
              >
                {deleting ? 'Deleting...' : 'Delete Profile'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirm(null)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black rounded-xl border border-slate-200 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
