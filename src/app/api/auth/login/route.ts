import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import User from '../../../../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    await dbConnect();

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 400 });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 400 });
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const response = NextResponse.json({ success: true, message: 'Logged in successfully' });
    
    // Set cookie (maxAge is in seconds for Next.js cookies API)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
