'use client';

import { useState, useMemo, Fragment } from 'react';
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
  suitStatus: string;
  updatedAt: string;
}

export default function ClientHistoryList({ initialClients }: { initialClients: ClientRecord[] }) {
  const [clients, setClients] = useState<ClientRecord[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Deletion states
  const [deleteConfirm, setDeleteConfirm] = useState<{ clientNo: string; name: string } | null>(null);
  const [deleteQueryConfirm, setDeleteQueryConfirm] = useState<{ id: string; clientNo: string; name: string; category: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // Expanded accordions state
  const [expandedClients, setExpandedClients] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (clientNo: string) => {
    setExpandedClients((prev) => ({
      ...prev,
      [clientNo]: !prev[clientNo],
    }));
  };

  const triggerDeleteConfirm = (clientNo: string, clientName: string) => {
    setDeleteError('');
    setDeleteConfirm({ clientNo, name: clientName });
  };

  const triggerDeleteQueryConfirm = (id: string, clientNo: string, clientName: string, category: string) => {
    setDeleteError('');
    setDeleteQueryConfirm({ id, clientNo, name: clientName, category });
  };

  const executeDeleteCustomer = async () => {
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

  const executeDeleteQuery = async () => {
    if (!deleteQueryConfirm) return;
    setDeleting(true);
    setDeleteError('');

    try {
      const response = await fetch(`/api/clients/${encodeURIComponent(deleteQueryConfirm.id)}?by=id`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete record');
      }

      setClients((prev) => prev.filter((c) => c._id !== deleteQueryConfirm.id));
      setDeleteQueryConfirm(null);
    } catch (error: any) {
      console.error('Delete query error:', error);
      setDeleteError(error.message || 'An error occurred while deleting');
    } finally {
      setDeleting(false);
    }
  };

  // Available category groups
  const categories = ['All', 'Suits', 'Sarees', 'Dresses', 'Kurtis & Kurtas', 'Lehengas', 'Blouses', 'Bottom Wear'];

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

  // Status badge styles helper
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Prepared but not handovered':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'Completed and handovered':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
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

  // Group filtered records by clientNo
  const groupedCustomers = useMemo(() => {
    const groups: {
      [key: string]: {
        clientNo: string;
        name: string;
        contactNo: string;
        alternativeNo?: string;
        queries: ClientRecord[];
      };
    } = {};

    filteredClients.forEach((client) => {
      if (!groups[client.clientNo]) {
        groups[client.clientNo] = {
          clientNo: client.clientNo,
          name: client.name,
          contactNo: client.contactNo,
          alternativeNo: client.alternativeNo,
          queries: [],
        };
      }
      groups[client.clientNo].queries.push(client);
    });

    // Sort queries inside each customer by updatedAt descending
    Object.values(groups).forEach((g) => {
      g.queries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });

    // Sort customers by the latest update time of their queries
    return Object.values(groups).sort((a, b) => {
      const aTime = a.queries.length > 0 ? new Date(a.queries[0].updatedAt).getTime() : 0;
      const bTime = b.queries.length > 0 ? new Date(b.queries[0].updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [filteredClients]);

  // Count unique customer profiles per category group dynamically
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    categories.forEach((cat) => {
      const matchingQueries = clients.filter(
        (c) => cat === 'All' || getGroupForCategory(c.category) === cat
      );
      counts[cat] = new Set(matchingQueries.map((c) => c.clientNo)).size;
    });
    return counts;
  }, [clients]);

  // Calculate unique profiles count reactively
  const uniqueProfilesCount = useMemo(() => {
    return new Set(clients.map((c) => c.clientNo)).size;
  }, [clients]);

  return (
    <div className="space-y-8">
      {/* Navigation Back Button & Profiles count (reactive) */}
      <div className="flex items-center justify-between select-none">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-slate-500 hover:text-[#9E7D3B] text-base sm:text-lg font-semibold transition-colors duration-150"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <span className="bg-slate-200 text-slate-800 border border-slate-300 px-3.5 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider">
          {uniqueProfilesCount} {uniqueProfilesCount === 1 ? 'Profile' : 'Profiles'}
        </span>
      </div>
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
      {groupedCustomers.length === 0 ? (
        <div className="text-center rounded-3xl border border-[#E6DFD3] bg-[#FCFAF5] p-12 max-w-xl mx-auto shadow-sm select-none">
          <svg className="h-12 w-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="font-extrabold text-slate-800 text-lg mb-1">No matches found</h3>
          <p className="text-slate-500 font-semibold text-sm">
            We couldn&apos;t find any records matching search criteria or category filter. Try clearing filters.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white border border-[#E6DFD3] rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-sm font-extrabold text-slate-500 tracking-wider select-none uppercase">
                  <th className="py-5 px-6 w-16 text-center"></th>
                  <th className="py-5 px-6">Customer Details</th>
                  <th className="py-5 px-6 w-36">Client Code</th>
                  <th className="py-5 px-6 w-48">Contact Number</th>
                  <th className="py-5 px-6 w-40 text-center">Orders Count</th>
                  <th className="py-5 px-6 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedCustomers.map((group) => {
                  const isExpanded = !!expandedClients[group.clientNo];
                  const queryCount = group.queries.length;

                  return (
                    <Fragment key={group.clientNo}>
                      {/* Main Customer Profile Row */}
                      <tr 
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(group.clientNo)}
                      >
                        {/* Expand/Collapse Arrow */}
                        <td className="py-5.5 px-6 text-center">
                          <button 
                            type="button" 
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <svg 
                              className={`h-4.5 w-4.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor" 
                              strokeWidth="2.5"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                            </svg>
                          </button>
                        </td>

                        {/* Customer Name */}
                        <td className="py-5.5 px-6">
                          <span className="font-black text-slate-800 text-lg sm:text-xl truncate block max-w-xs leading-snug">
                            {group.name}
                          </span>
                        </td>

                        {/* Client Code */}
                        <td className="py-5.5 px-6 font-black text-slate-700 text-base">
                          {group.clientNo}
                        </td>

                        {/* Primary Phone */}
                        <td className="py-5.5 px-6 font-extrabold text-slate-700 text-base">
                          {group.contactNo}
                        </td>

                        {/* Orders count badge */}
                        <td className="py-5.5 px-6 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black rounded-full select-none">
                            {queryCount} {queryCount === 1 ? 'Order' : 'Orders'}
                          </span>
                        </td>

                        {/* Actions (Delete All records of this customer) */}
                        <td className="py-5.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerDeleteConfirm(group.clientNo, group.name);
                            }}
                            className="p-2 border border-rose-200 hover:border-rose-400 bg-white hover:bg-rose-50 text-rose-600 rounded-full transition-all shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.97] cursor-pointer inline-flex items-center justify-center"
                            title="Delete Customer Profile & All Queries"
                          >
                            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        </td>
                      </tr>

                      {/* Collapsible Sub-Table showing queries */}
                      {isExpanded && (
                        <tr className="bg-[#FAF9F5]/45">
                          <td colSpan={6} className="p-0 border-t border-slate-100">
                            <div className="px-12 py-5 border-l-4 border-[#9E7D3B] space-y-4">
                              <h4 className="text-xs font-black tracking-widest text-[#9E7D3B] uppercase select-none">
                                Orders / Suits history for this Customer
                              </h4>
                              
                              <div className="border border-slate-100 rounded-2xl bg-white shadow-inner overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 tracking-wider uppercase select-none">
                                      <th className="py-3.5 px-5 w-20 text-center">Cover</th>
                                      <th className="py-3.5 px-5">Category</th>
                                      <th className="py-3.5 px-5 w-32">Stitching Price</th>
                                      <th className="py-3.5 px-5 w-40 text-center">Status</th>
                                      <th className="py-3.5 px-5 w-44">Registered Date</th>
                                      <th className="py-3.5 px-5 w-56 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {group.queries.map((q) => {
                                      const hasImage = q.images && q.images.length > 0;
                                      const primaryImage = hasImage ? q.images[0] : null;

                                      return (
                                        <tr key={q._id} className="hover:bg-slate-50/40 transition-colors">
                                          {/* Style cover */}
                                          <td className="py-3 px-5 text-center">
                                            {primaryImage ? (
                                              <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-slate-200 mx-auto bg-slate-100 shadow-sm shrink-0">
                                                <Image
                                                  src={primaryImage}
                                                  alt={q.category}
                                                  fill
                                                  sizes="40px"
                                                  className="object-cover"
                                                />
                                              </div>
                                            ) : (
                                              <div className="h-10 w-10 rounded-lg border border-[#E6DFD3] mx-auto bg-[#FCFAF5] flex items-center justify-center text-[9px] font-black text-slate-400 tracking-widest shrink-0 uppercase select-none">
                                                No Pic
                                              </div>
                                            )}
                                          </td>

                                          {/* Category */}
                                          <td className="py-3 px-5">
                                            <span className={`inline-block border rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${getCategoryStyles(q.category)}`}>
                                              {q.category}
                                            </span>
                                          </td>

                                          {/* Stitching Price */}
                                          <td className="py-3 px-5 font-black text-slate-800">
                                            Rs. {q.price !== undefined ? q.price.toLocaleString('en-IN') : '0'}
                                          </td>

                                          {/* Status */}
                                          <td className="py-3 px-5 text-center select-none">
                                            <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${getStatusStyles(q.suitStatus)}`}>
                                              {q.suitStatus || 'Pending'}
                                            </span>
                                          </td>

                                          {/* Date */}
                                          <td className="py-3 px-5 text-slate-500 font-semibold text-xs select-none">
                                            {new Date(q.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                          </td>

                                          {/* Actions */}
                                          <td className="py-3 px-5 text-right select-none">
                                            <div className="flex items-center justify-end gap-2">
                                              <Link
                                                href={`/admin/pending/measurement?id=${q._id}`}
                                                className="px-3.5 py-1.5 border border-[#E6DFD3] hover:border-[#9E7D3B] bg-white hover:bg-[#FCFAF5] text-slate-700 hover:text-[#9E7D3B] text-[10px] font-black rounded-full transition-all shadow-sm hover:scale-[1.03] active:scale-[0.97]"
                                              >
                                                Drawing
                                              </Link>
                                              <Link
                                                href={`/admin/new?id=${q._id}`}
                                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-full transition-all hover:scale-[1.03] active:scale-[0.97]"
                                              >
                                                Edit
                                              </Link>
                                              <button
                                                type="button"
                                                onClick={() => triggerDeleteQueryConfirm(q._id, group.clientNo, group.name, q.category)}
                                                className="p-1.5 border border-rose-100 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600 rounded-full transition-all cursor-pointer inline-flex items-center justify-center shadow-sm"
                                                title="Delete this query/order record"
                                              >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Compact Card List View */}
          <div className="lg:hidden space-y-6">
            {groupedCustomers.map((group) => {
              const isExpanded = !!expandedClients[group.clientNo];
              const queryCount = group.queries.length;

              return (
                <div
                  key={group.clientNo}
                  className="bg-white border border-[#E6DFD3] rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col group overflow-hidden"
                >
                  {/* Customer summary row */}
                  <div 
                    onClick={() => toggleExpand(group.clientNo)}
                    className="p-6 cursor-pointer hover:bg-slate-50/40 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-black text-slate-800 text-xl leading-snug">
                        {group.name}
                      </h3>
                      <p className="text-slate-400 font-bold text-xs mt-0.5 select-none">
                        Code: {group.clientNo} | {group.contactNo}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-[#9E7D3B] text-[10px] font-black rounded-full select-none uppercase tracking-wider shrink-0">
                        {queryCount} {queryCount === 1 ? 'Order' : 'Orders'}
                      </span>
                      <svg 
                        className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-95' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded nested list for mobile */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-[#FCFAF5]/30 p-5 space-y-4">
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-white overflow-hidden shadow-inner">
                        {group.queries.map((q) => {
                          const hasImage = q.images && q.images.length > 0;
                          const primaryImage = hasImage ? q.images[0] : null;

                          return (
                            <div key={q._id} className="p-4 flex gap-4 items-start hover:bg-slate-50/30 transition-colors">
                              {primaryImage ? (
                                <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm shrink-0">
                                  <Image
                                    src={primaryImage}
                                    alt={q.category}
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-16 w-16 rounded-xl border border-[#E6DFD3] bg-[#FCFAF5] flex flex-col items-center justify-center text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0 select-none">
                                  <span>No image</span>
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`inline-block border rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${getCategoryStyles(q.category)}`}>
                                    {q.category}
                                  </span>
                                  <span className="text-slate-500 font-extrabold text-xs">
                                    Rs. {q.price !== undefined ? q.price.toLocaleString('en-IN') : '0'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2 select-none">
                                  <span className={`inline-block border rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${getStatusStyles(q.suitStatus)}`}>
                                    {q.suitStatus || 'Pending'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {new Date(q.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>

                                {/* Actions row for this single query */}
                                <div className="flex items-center justify-end gap-2 mt-3.5 border-t border-slate-100/60 pt-3 select-none">
                                  <Link
                                    href={`/admin/pending/measurement?id=${q._id}`}
                                    className="px-3.5 py-1.5 border border-[#E6DFD3] hover:border-[#9E7D3B] bg-white hover:bg-[#FCFAF5] text-slate-700 hover:text-[#9E7D3B] text-[10px] font-black rounded-full transition-all"
                                  >
                                    Drawing
                                  </Link>
                                  <Link
                                    href={`/admin/new?id=${q._id}`}
                                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-full transition-all"
                                  >
                                    Edit
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => triggerDeleteQueryConfirm(q._id, group.clientNo, group.name, q.category)}
                                    className="px-3 py-1.5 border border-rose-100 hover:border-rose-300 bg-white text-rose-600 rounded-full transition-all inline-flex items-center justify-center text-[10px] font-black gap-1"
                                    title="Delete query record"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Delete profile row */}
                      <div className="flex justify-end pt-2 select-none">
                        <button
                          type="button"
                          onClick={() => triggerDeleteConfirm(group.clientNo, group.name)}
                          className="px-4 py-2 border border-rose-200 hover:border-rose-400 bg-white hover:bg-rose-50 text-rose-600 text-xs font-black rounded-full transition-all inline-flex items-center gap-1.5"
                          title="Delete entire profile"
                        >
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Delete Entire Customer Profile
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Delete Customer Profile Modal (All Records) */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E6DFD3] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Delete Customer Profile</h3>
                <p className="text-xs text-[#9E7D3B] font-bold uppercase tracking-wider">Warning: Permanent Action</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-100">
                {deleteError}
              </div>
            )}

            <p className="text-sm font-semibold text-[#1A1A1A] leading-relaxed">
              Are you sure you want to delete <strong className="text-[#1A1A1A] font-black">"{deleteConfirm.name}" ({deleteConfirm.clientNo})</strong> and all their order histories? This will completely wipe all measurements.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={executeDeleteCustomer}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-rose-200/50"
              >
                {deleting ? 'Deleting...' : 'Delete Everything'}
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

      {/* Delete Single Query Modal */}
      {deleteQueryConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E6DFD3] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Delete Single Order</h3>
                <p className="text-xs text-[#9E7D3B] font-bold uppercase tracking-wider">Warning: Single Deletion</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-100">
                {deleteError}
              </div>
            )}

            <p className="text-sm font-semibold text-[#1A1A1A] leading-relaxed">
              Are you sure you want to delete the <strong className="text-[#1A1A1A] font-black">{deleteQueryConfirm.category}</strong> order record for <strong className="text-[#1A1A1A] font-black">{deleteQueryConfirm.name} ({deleteQueryConfirm.clientNo})</strong>? Other orders for this customer will be kept.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={executeDeleteQuery}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-rose-200/50"
              >
                {deleting ? 'Deleting...' : 'Delete Order'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteQueryConfirm(null)}
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
