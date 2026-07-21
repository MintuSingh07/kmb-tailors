import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Client from '../../../../models/Client';
import ClientDetailsView from './ClientDetailsView';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

interface DecodedToken {
  userId: string;
  username: string;
}

interface PageProps {
  params: Promise<{ clientNo: string }>;
}

export default async function ClientDetailsPage(props: PageProps) {
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

  const { clientNo } = await props.params;

  await dbConnect();
  
  // Fetch all order records for this customer client code
  const clientRecordsRaw = await Client.find({ clientNo }).sort({ updatedAt: -1 }).lean();

  if (clientRecordsRaw.length === 0) {
    redirect('/admin/history');
  }

  // Convert raw Mongoose records to serializable records (specifically converting _id and Dates to strings)
  const clientRecords = clientRecordsRaw.map((rec: any) => ({
    ...rec,
    _id: rec._id.toString(),
    createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : rec.createdAt,
    updatedAt: rec.updatedAt instanceof Date ? rec.updatedAt.toISOString() : rec.updatedAt,
  }));

  const profile = clientRecords[0];

  return (
    <ClientDetailsView
      clientRecords={clientRecords}
      profile={profile}
      username={username}
    />
  );
}
