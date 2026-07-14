import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/db';
import Client from '../../../models/Client';
import LogoutButton from '../LogoutButton';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

interface DecodedToken {
  userId: string;
  username: string;
}

export default async function PendingSuitsPage() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');
  const token = tokenCookie?.value;

  if (!token) {
    redirect('/login');
  }

  let username = '';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    username = decoded.username;
  } catch (err) {
    redirect('/login');
  }

  // Connect to database and fetch all pending suits
  await dbConnect();
  const pendingSuits = await Client.find({ category: 'Suit' }).sort({ updatedAt: -1 });

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-[#1A1A1A] font-sans pb-24 overflow-x-hidden">
      {/* Background Subtle Glows */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-[#E8DCC4]/20 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 translate-x-1/2 rounded-full bg-[#DFD3C3]/35 blur-[150px] pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 select-none">
            <Image
              src="/logo.png"
              alt="KMB Tailor Logo"
              fill
              sizes="(max-width: 640px) 40px, 48px"
              priority
              className="object-contain"
            />
          </div>
          <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-[#1A1A1A]">
            KMB Tailor <span className="hidden min-[450px]:inline-block font-semibold text-slate-500 text-sm sm:text-lg ml-1.5 border-l border-slate-200 pl-2.5">Pending Queue</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-base sm:text-lg text-slate-500 hidden sm:inline">
            Logged as, <strong className="text-[#9E7D3B] capitalize font-bold">{username}</strong>
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full z-10">
        {/* Navigation Back Button */}
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
          <span className="bg-[#9E7D3B]/10 text-[#9E7D3B] border border-[#E6DFD3] px-3.5 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider">
            {pendingSuits.length} {pendingSuits.length === 1 ? 'Suit' : 'Suits'} Pending
          </span>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#1A1A1A] mb-2">
            Pending Suits
          </h1>
          <p className="text-slate-500 text-lg sm:text-xl leading-relaxed">
            Tailoring queue for Three-Piece Suits. Click on a file to view or edit customer details.
          </p>
        </div>

        {/* Dynamic Queue Grid */}
        {pendingSuits.length === 0 ? (
          <div className="rounded-3xl border border-[#E6DFD3] bg-[#FCFAF5] p-12 text-center shadow-xl shadow-slate-200/30 flex flex-col items-center justify-center max-w-2xl mx-auto">
            <div className="p-5 bg-white rounded-full border border-slate-200/60 shadow-sm mb-4">
              <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">Queue is Clear</h2>
            <p className="text-slate-500 font-semibold mb-6">No pending suits in the tailoring queue. Create a new measurement file to begin.</p>
            <Link
              href="/admin/new"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#DFBA6B] to-[#9E7D3B] hover:from-[#E3C277] hover:to-[#A78542] text-white font-extrabold text-sm sm:text-base shadow-md shadow-[#9E7D3B]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Create Suit File
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {pendingSuits.map((client) => {
              const hasImage = client.images && client.images.length > 0;
              const primaryImage = hasImage ? client.images[0] : null;

              return (
                <div
                  key={client._id.toString()}
                  className="bg-white border border-[#E6DFD3] rounded-3xl shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Card Cover Image */}
                    {primaryImage ? (
                      <div className="relative h-48 w-full bg-slate-100 select-none border-b border-[#E6DFD3]/40">
                        <Image
                          src={primaryImage}
                          alt={`${client.name} Style`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-48 w-full bg-gradient-to-br from-[#FCFAF5] to-[#E6DFD3] flex flex-col items-center justify-center select-none border-b border-[#E6DFD3]/40">
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
                          No Style Photo
                        </span>
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl sm:text-2xl font-black text-slate-800 truncate leading-snug">
                            {client.name}
                          </h2>
                          <span className="inline-block text-[#9E7D3B] bg-[#9E7D3B]/10 border border-[#E6DFD3] rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider mt-1 select-none">
                            Three-Piece Suit
                          </span>
                        </div>
                        <span className="text-[#9E7D3B] bg-[#FCFAF5] border border-[#E6DFD3] rounded-lg px-2.5 py-1 text-xs font-black tracking-wider select-none shrink-0">
                          {client.clientNo}
                        </span>
                      </div>

                      {/* Contact Number & Price */}
                      <div className="space-y-2 border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 text-slate-600 text-sm sm:text-base">
                            <svg className="h-4.5 w-4.5 text-[#9E7D3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <a href={`tel:${client.contactNo}`} className="hover:text-[#9E7D3B] font-bold transition-colors">
                              {client.contactNo}
                            </a>
                          </div>
                          <span className="text-slate-800 font-extrabold text-sm sm:text-base">
                            Rs. {client.price !== undefined ? client.price.toLocaleString('en-IN') : '8,500'}
                          </span>
                        </div>
                        {client.alternativeNo && (
                          <div className="flex items-center gap-2.5 text-slate-500 text-xs sm:text-sm">
                            <span className="w-4.5 text-center font-bold text-[#9E7D3B] text-[10px] uppercase">Alt</span>
                            <a href={`tel:${client.alternativeNo}`} className="hover:text-[#9E7D3B] font-semibold transition-colors">
                              {client.alternativeNo}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                    <span className="text-[11px] text-slate-400 font-semibold select-none">
                      Updated {new Date(client.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <Link
                      href={`/admin/new?code=${encodeURIComponent(client.clientNo)}`}
                      className="px-4 py-2 bg-gradient-to-r from-[#DFBA6B] to-[#9E7D3B] hover:from-[#E3C277] hover:to-[#A78542] text-white text-xs font-black rounded-xl shadow-md shadow-[#9E7D3B]/10 hover:scale-[1.03] active:scale-[0.97] transition-all"
                    >
                      Edit &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
