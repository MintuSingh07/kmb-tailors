import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import Client from '../../../../models/Client';
import { uploadToCloudinary } from '../../../../lib/cloudinary';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function POST(request: NextRequest) {
  try {
    // Validate JWT
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No session token found' }, { status: 401 });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
    }

    const { id, clientNo, status, images, price } = await request.json();

    if (!clientNo || !status) {
      return NextResponse.json({ error: 'Client Number and Status are required' }, { status: 400 });
    }

    const validStatuses = ['Pending', 'Prepared but not handovered', 'Completed and handovered'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    await dbConnect();

    const client = id
      ? await Client.findById(id)
      : await Client.findOne({ clientNo }).sort({ updatedAt: -1 });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    client.suitStatus = status;
    if (price !== undefined && price !== null) {
      client.price = Number(price);
    }
    if (images && Array.isArray(images)) {
      const uploadedHandoverImages: string[] = [];
      for (const img of images) {
        const url = await uploadToCloudinary(img);
        uploadedHandoverImages.push(url);
      }
      client.handoverImages = [...(client.handoverImages || []), ...uploadedHandoverImages];
    }
    await client.save();

    return NextResponse.json({ success: true, message: `Status updated to ${status} successfully`, client });
  } catch (error: any) {
    console.error('Error updating status:', error);
    return NextResponse.json({ error: 'Internal server error while updating status' }, { status: 500 });
  }
}
