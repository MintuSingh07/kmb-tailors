import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Client from '../../../../models/Client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ clientNo: string }> }
) {
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

    const params = await props.params;
    const clientNo = params.clientNo;
    if (!clientNo) {
      return NextResponse.json({ error: 'Client Number is required' }, { status: 400 });
    }

    await dbConnect();
    const client = await Client.findOne({ clientNo });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error: any) {
    console.error('Error fetching client details:', error);
    return NextResponse.json({ error: 'Internal server error while fetching client details' }, { status: 500 });
  }
}
