import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      // Valid session -> redirect directly to the admin dashboard
      redirect('/admin');
    } catch (err) {
      // Invalid/expired session -> redirect to login
      redirect('/login');
    }
  }

  // No session -> redirect directly to login
  redirect('/login');
}
