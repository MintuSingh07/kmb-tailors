import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Client from '../../../../models/Client';
import LogoutButton from '../../LogoutButton';
import StatusActions from './StatusActions';
import MeasurementViewer from './MeasurementViewer';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

interface DecodedToken {
  userId: string;
  username: string;
}

interface PageProps {
  searchParams: Promise<{ code?: string; id?: string }>;
}

export default async function MeasurementPage(props: PageProps) {
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

  const searchParams = await props.searchParams;
  const id = searchParams.id;
  const clientNo = searchParams.code;

  if (!id && !clientNo) {
    redirect('/admin/pending');
  }

  await dbConnect();
  const client = id 
    ? await Client.findById(id)
    : await Client.findOne({ clientNo }).sort({ updatedAt: -1 });

  if (!client) {
    redirect('/admin/pending');
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-[#1A1A1A] font-sans pb-24 overflow-x-hidden">
      {/* Background Subtle Glows */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-[#E8DCC4]/20 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 translate-x-1/2 rounded-full bg-[#DFD3C3]/35 blur-[150px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E6DFD3] shadow-sm select-none">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image src="/logo.png" alt="KMB Boutique Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">KMB Boutique</h1>
              <p className="text-[10px] text-[#9E7D3B] font-bold tracking-widest uppercase">Whiteboard viewer</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm text-slate-500 font-semibold hidden sm:inline">
              Logged as, <strong className="text-[#9E7D3B] font-black">{username}</strong>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl w-full px-4 pt-8 sm:px-6 lg:px-8 flex-1 flex flex-col justify-start">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between select-none">
          <Link
            href="/admin/pending"
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-[#9E7D3B] transition-colors"
          >
            <svg className="h-4.5 w-4.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Queue
          </Link>
        </div>

        {/* Focused Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          
          {/* Left Side: Whiteboard Sketch Notes (Clickable Drawing Preview) */}
          <div className="lg:col-span-7 space-y-2">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 select-none">
              Whiteboard Sketch Notes (Click to Edit)
            </span>
            
            <MeasurementViewer
              clientNo={client.clientNo}
              clientId={client._id.toString()}
              clientName={client.name}
              primaryDrawing={client.measurementDrawing || ''}
              drawings={client.measurementDrawings || []}
            />
          </div>

          {/* Right Side: Customer identity and status controller */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Identity Card */}
            <div className="bg-white border border-[#E6DFD3] rounded-3xl p-6 shadow-sm">
              <span className="text-[10px] text-[#9E7D3B] bg-[#9E7D3B]/10 border border-[#E6DFD3] rounded-full px-2.5 py-0.5 font-black uppercase tracking-wider select-none">
                Suit Order Record
              </span>
              
              <h2 className="text-3xl font-black text-slate-800 leading-tight mt-3 truncate">
                {client.name}
              </h2>
              
              <p className="text-slate-500 font-extrabold text-sm uppercase tracking-wider mt-1 select-none">
                Client Code: <span className="text-[#9E7D3B]">{client.clientNo}</span>
              </p>
            </div>

            {/* Interactive Status Controller Component */}
            <StatusActions 
              clientNo={client.clientNo} 
              clientId={client._id.toString()} 
              currentStatus={client.suitStatus || 'Pending'} 
            />
          </div>

        </div>
      </main>
    </div>
  );
}
