import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/db';
import Client from '../../../models/Client';
import LogoutButton from '../LogoutButton';
import PendingSuitsList from './PendingSuitsList';

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
  const pendingSuits = await Client.find({
    $or: [{ suitStatus: 'Pending' }, { suitStatus: { $exists: false } }, { suitStatus: null }]
  }).sort({ updatedAt: -1 });

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
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
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

        <div className="mb-6 select-none">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1A1A1A] mb-1.5">
            Pending Suits
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-semibold">
            Tailoring queue for Three-Piece Suits. Click card to edit profile details or select Measurement to view sketches.
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
          <PendingSuitsList initialSuits={JSON.parse(JSON.stringify(pendingSuits))} />
        )}
      </main>
    </div>
  );
}
