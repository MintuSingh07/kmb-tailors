import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Client from '../../../../models/Client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const clients = await Client.find({}).sort({ updatedAt: -1 });
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Error fetching all clients for offline sync:', error);
    return NextResponse.json({ error: 'Failed to fetch offline sync data' }, { status: 500 });
  }
}
