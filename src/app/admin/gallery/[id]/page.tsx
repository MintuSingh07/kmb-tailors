import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Client from '../../../../models/Client';
import GalleryView from './GalleryView';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

interface DecodedToken {
  userId: string;
  username: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientGalleryPage(props: PageProps) {
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

  const { id } = await props.params;

  await dbConnect();
  
  const clientRaw = await Client.findById(id).lean();

  if (!clientRaw) {
    redirect('/admin/completed');
  }

  const client = JSON.parse(JSON.stringify(clientRaw));

  return (
    <GalleryView 
      clientId={client._id}
      clientName={client.name}
      clientNo={client.clientNo}
      images={client.images || []}
      handoverImages={client.handoverImages || []}
      username={username}
    />
  );
}
