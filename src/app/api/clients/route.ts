import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/db';
import Client from '../../../models/Client';
import { uploadToCloudinary } from '../../../lib/cloudinary';

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

    const body = await request.json();
    const { id, clientNo, name, contactNo, alternativeNo, category, images, handoverImages, measurementDrawing, measurementDrawings, strokes, price, suitStatus } = body;

    if (!clientNo || !name || !contactNo || !category) {
      return NextResponse.json({ error: 'Client No, Name, Contact No, and Category are required' }, { status: 400 });
    }

    const parsedPrice = price !== undefined && price !== null && !isNaN(Number(price)) ? Number(price) : 0;

    await dbConnect();

    // Upload base64 strings to Cloudinary (or fallback to base64 if not configured)
    const uploadedImages: string[] = [];
    if (images && Array.isArray(images)) {
      for (const img of images) {
        const url = await uploadToCloudinary(img);
        uploadedImages.push(url);
      }
    }

    const uploadedHandoverImages: string[] = [];
    if (handoverImages && Array.isArray(handoverImages)) {
      for (const img of handoverImages) {
        const url = await uploadToCloudinary(img);
        uploadedHandoverImages.push(url);
      }
    }

    const uploadedMeasurementDrawing = await uploadToCloudinary(measurementDrawing);

    const uploadedMeasurementDrawings: string[] = [];
    if (measurementDrawings && Array.isArray(measurementDrawings)) {
      for (const img of measurementDrawings) {
        const url = await uploadToCloudinary(img);
        uploadedMeasurementDrawings.push(url);
      }
    }

    // Check if client exists by ID to update it, otherwise create a new query/measurement
    let existingClient = null;
    if (id) {
      existingClient = await Client.findById(id);
    }

    if (existingClient) {
      // Update existing client
      existingClient.name = name;
      existingClient.contactNo = contactNo;
      existingClient.alternativeNo = alternativeNo;
      existingClient.category = category;
      existingClient.images = uploadedImages;
      existingClient.handoverImages = uploadedHandoverImages;
      existingClient.measurementDrawing = uploadedMeasurementDrawing;
      existingClient.measurementDrawings = uploadedMeasurementDrawings;
      existingClient.strokes = strokes || [];
      existingClient.price = parsedPrice;
      if (suitStatus) {
        existingClient.suitStatus = suitStatus;
      }
      await existingClient.save();

      return NextResponse.json({ success: true, message: 'Client measurements updated successfully', client: existingClient });
    }

    const client = new Client({
      clientNo,
      name,
      contactNo,
      alternativeNo,
      category,
      images: uploadedImages,
      handoverImages: uploadedHandoverImages,
      measurementDrawing: uploadedMeasurementDrawing,
      measurementDrawings: uploadedMeasurementDrawings,
      strokes: strokes || [],
      price: parsedPrice,
      suitStatus: suitStatus || 'Pending',
    });

    await client.save();

    return NextResponse.json({ success: true, message: 'Client registered successfully', client }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving client:', error);
    return NextResponse.json({ error: 'Internal server error while saving client' }, { status: 500 });
  }
}
