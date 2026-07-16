import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Client from '../../../../models/Client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No session token found' }, { status: 401 });
    }
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json([]);
    }

    await dbConnect();
    // Search matching code or name
    const clients = await Client.find({
      $or: [
        { clientNo: { $regex: new RegExp(query, 'i') } },
        { name: { $regex: new RegExp(query, 'i') } }
      ]
    })
    .select('clientNo name')
    .limit(5);

    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Error searching clients:', error);
    return NextResponse.json({ error: 'Internal server error while searching clients' }, { status: 500 });
  }
}
