import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import jwt from 'jsonwebtoken';
import LogoutButton from './LogoutButton';
import dbConnect from '../../lib/db';
import Client from '../../models/Client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

interface DecodedToken {
  userId: string;
  username: string;
  role: string;
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');
  const token = tokenCookie?.value;

  if (!token) {
    redirect('/login');
  }

  let username = '';
  let role = 'admin';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    username = decoded.username;
    role = decoded.role || 'admin';
  } catch (err) {
    redirect('/login');
  }

  // Connect to database and retrieve dynamic counts/calculations
  await dbConnect();
  const allClients = await Client.find({}).select('-measurementDrawing -measurementDrawings -strokes -images');

  const pricing: { [key: string]: number } = {
    Suit: 8500,
    Sherwani: 12000,
    Kurta: 2500,
    Coat: 5000,
    Pants: 1500,
    Shirt: 1200,
  };

  let totalEarningValue = 0;
  let todaysEarningValue = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  allClients.forEach((client: any) => {
    const price = client.price !== undefined && client.price !== null ? client.price : (pricing[client.category] || 0);
    totalEarningValue += price;

    const createdAt = new Date(client.createdAt);
    if (createdAt >= today) {
      todaysEarningValue += price;
    }
  });

  const pendingSuitsCount = allClients.filter(
    (c: any) => c.suitStatus === 'Pending' || !c.suitStatus
  ).length;

  const preparedSuitsCount = allClients.filter(
    (c: any) => c.suitStatus === 'Prepared but not handovered'
  ).length;

  const completedSuitsCount = allClients.filter(
    (c: any) => c.suitStatus === 'Completed and handovered'
  ).length;

  const totalPhotosCount = allClients.reduce((sum: number, c: any) => sum + (c.handoverImages?.length || 0), 0);
  const uniqueClientsSet = new Set(allClients.map((c: any) => c.clientNo));
  const clientHistoryCount = uniqueClientsSet.size;

  const stats = [
    {
      id: 'total-earning',
      title: 'Total Earning',
      value: `Rs. ${totalEarningValue.toLocaleString('en-IN')}`,
      description: 'Overall generated revenue',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-[#9E7D3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: 'All-time',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      cardClass: 'border-[#EBE4B5] bg-[#FCF9E8] hover:border-[#C5A85C] hover:bg-[#FDFCF2]',
      iconClass: 'border-[#EBE4B5]',
    },
    {
      id: 'todays-earning',
      title: "Today's Earning",
      value: `Rs. ${todaysEarningValue.toLocaleString('en-IN')}`,
      description: 'Revenue collected today',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      badge: 'Today',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cardClass: 'border-[#C5E2CB] bg-[#EAF5EC] hover:border-[#6CB07B] hover:bg-[#F1FAF3]',
      iconClass: 'border-[#C5E2CB]',
    },
    {
      id: 'pending-suits',
      title: 'Pending Suits',
      value: `${pendingSuitsCount}`,
      description: 'In tailoring queue',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: 'In Progress',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      cardClass: 'border-[#F0D5BE] bg-[#FDF1E6] hover:border-[#E0995E] hover:bg-[#FEF7F0]',
      iconClass: 'border-[#F0D5BE]',
    },
    {
      id: 'completed-suits',
      title: 'Completed Suits',
      value: `${completedSuitsCount}`,
      description: 'Successfully stitched & completed',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: 'Finished',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      cardClass: 'border-[#BBDDF5] bg-[#E8F4FC] hover:border-[#5FA8DB] hover:bg-[#F2F9FD]',
      iconClass: 'border-[#BBDDF5]',
    },
    {
      id: 'photos',
      title: 'Photos',
      value: `${totalPhotosCount} ${totalPhotosCount === 1 ? 'Photo' : 'Photos'}`,
      description: 'Catalog & design assets',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-violet-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      badge: 'Gallery',
      badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
      cardClass: 'border-[#C8C8EF] bg-[#EFEFFA] hover:border-[#7A7AD6] hover:bg-[#F6F6FD]',
      iconClass: 'border-[#C8C8EF]',
    },
    {
      id: 'prepared-not-handovered',
      title: 'Prepared but not handovered',
      value: `${preparedSuitsCount}`,
      description: 'Awaiting client pickup',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-rose-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      badge: 'Ready',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      cardClass: 'border-[#F3CDD2] bg-[#FCECEE] hover:border-[#DF8491] hover:bg-[#FDF3F5]',
      iconClass: 'border-[#F3CDD2]',
    },
    {
      id: 'client-history',
      title: 'Client History',
      value: `${clientHistoryCount} ${clientHistoryCount === 1 ? 'Profile' : 'Profiles'}`,
      description: 'Measurements & client records',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      badge: 'Database',
      badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
      cardClass: 'border-[#CFD8DC] bg-[#ECEFF1] hover:border-[#78909C] hover:bg-[#F4F6F7]',
      iconClass: 'border-[#CFD8DC]',
    },
  ];

  // Filter stats cards visibility based on user roles
  const visibleStats = role === 'manager'
    ? stats.filter((s) => ['pending-suits', 'photos', 'prepared-not-handovered', 'completed-suits', 'client-history'].includes(s.id))
    : stats.filter((s) => ['total-earning', 'todays-earning', 'client-history', 'completed-suits'].includes(s.id));

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
              alt="KBM Boutique Logo"
              fill
              sizes="(max-width: 640px) 40px, 48px"
              priority
              className="object-contain"
            />
          </div>
          <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-[#1A1A1A]">
            KBM Boutique <span className="hidden min-[450px]:inline-block font-semibold text-slate-500 text-sm sm:text-lg ml-1.5 border-l border-slate-200 pl-2.5">Admin Portal</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-base sm:text-lg text-slate-500 hidden sm:inline">
             {role === 'manager' ? 'Manager' : 'Welcome,'}{' '}<strong className="text-[#9E7D3B] capitalize font-bold">{username}</strong>
           </span>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="mb-6 select-none">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1A1A1A] mb-1.5">
            {role === 'manager' ? 'Business Overview' : 'Workspace'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-semibold">
            {role === 'manager'
              ? 'Earnings summary and completed order metrics.'
              : 'Tailoring operation metrics and business insights.'}
          </p>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {visibleStats.map((stat) => {
            const cardContent = (
              <>
                <div className="flex items-start justify-between mb-2.5 select-none">
                  <div className={`p-2 sm:p-2.5 bg-white rounded-xl border shadow-xs ${stat.iconClass}`}>
                    {stat.icon}
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] sm:text-xs font-bold rounded-full border ${stat.badgeColor}`}>
                    {stat.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">
                    {stat.title}
                  </h3>
                  <p className="text-xl sm:text-2xl font-black text-[#1A1A1A] tracking-tight mb-0.5">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    {stat.description}
                  </p>
                </div>
              </>
            );

            const cardClasses = `rounded-2xl border p-4 sm:p-5 shadow-xs hover:shadow-md hover:scale-[1.005] transition-all duration-200 flex flex-col justify-between ${stat.cardClass}`;

            if (stat.id === 'pending-suits') {
              return (
                <Link key={stat.id} href="/admin/pending" className={cardClasses}>
                  {cardContent}
                </Link>
              );
            }
            if (stat.id === 'prepared-not-handovered') {
              return (
                <Link key={stat.id} href="/admin/prepared" className={cardClasses}>
                  {cardContent}
                </Link>
              );
            }
            if (stat.id === 'completed-suits') {
              return (
                <Link key={stat.id} href="/admin/completed" className={cardClasses}>
                  {cardContent}
                </Link>
              );
            }
            if (stat.id === 'photos') {
              return (
                <Link key={stat.id} href="/admin/photos" className={cardClasses}>
                  {cardContent}
                </Link>
              );
            }
            if (stat.id === 'client-history') {
              return (
                <Link key={stat.id} href="/admin/history" className={cardClasses}>
                  {cardContent}
                </Link>
              );
            }
            return (
              <div key={stat.id} className={cardClasses}>
                {cardContent}
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Action Button — Create New Query/Client */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50">
        <Link
          href="/admin/new"
          title="Create New Query"
          className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-r from-[#DFBA6B] to-[#9E7D3B] hover:from-[#E3C277] hover:to-[#A78542] text-white flex items-center justify-center shadow-xl shadow-[#9E7D3B]/30 hover:scale-110 active:scale-95 transition-all duration-200 group focus:outline-none"
        >
          <svg className="h-8 w-8 sm:h-10 sm:w-10 transition-transform duration-200 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
