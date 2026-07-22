import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dbConnect from '../../../../../lib/db';
import Client from '../../../../../models/Client';
import { uploadToCloudinary } from '../../../../../lib/cloudinary';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ clientNo: string }> }
) {
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

    const { clientNo } = await props.params;
    const body = await request.json();
    const { newImages } = body;

    if (!newImages || !Array.isArray(newImages)) {
      return NextResponse.json({ error: 'newImages array is required' }, { status: 400 });
    }

    await dbConnect();
    let client = null;
    if (mongoose.Types.ObjectId.isValid(clientNo)) {
      client = await Client.findById(clientNo);
    }
    if (!client) {
      client = await Client.findOne({ clientNo }).sort({ updatedAt: -1 });
    }
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const uploadedUrls: string[] = [];
    for (const img of newImages) {
      const url = await uploadToCloudinary(img);
      uploadedUrls.push(url);
    }

    // Prepend to handoverImages so newest uploaded photos appear first
    client.handoverImages = [...uploadedUrls, ...(client.handoverImages || [])];
    await client.save();

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error('Error adding images:', error);
    return NextResponse.json({ error: error.message || 'Server error while uploading photos' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ clientNo: string }> }
) {
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

    const { clientNo } = await props.params;
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    await dbConnect();
    let client = null;
    if (mongoose.Types.ObjectId.isValid(clientNo)) {
      client = await Client.findById(clientNo);
    }
    if (!client) {
      client = await Client.findOne({ clientNo }).sort({ updatedAt: -1 });
    }
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Filter out the image from both lists
    client.images = (client.images || []).filter((url: string) => url !== imageUrl);
    client.handoverImages = (client.handoverImages || []).filter((url: string) => url !== imageUrl);
    await client.save();

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Server error while deleting photo' }, { status: 500 });
  }
}
