import express, { Request, Response } from 'express';
import next from 'next';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from './src/lib/db';
import User from './src/models/User';
import Client from './src/models/Client';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Helper to upload base64 image strings to Cloudinary
const uploadToCloudinary = async (base64Str: string): Promise<string> => {
  if (!base64Str || !base64Str.startsWith('data:image/')) {
    return base64Str; // Already a URL or empty
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary credentials missing in .env. Falling back to local MongoDB base64 storage.');
    return base64Str;
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Str, {
      folder: 'kmb-tailor',
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    return base64Str; // Fallback to base64 on failure
  }
};

// Connect to MongoDB
dbConnect().catch((err) => {
  console.error('Initial MongoDB connection error:', err);
});

app.prepare().then(() => {
  const server = express();

  // Basic middleware
  server.use(cors());
  server.use(express.json({ limit: '50mb' }));
  server.use(express.urlencoded({ limit: '50mb', extended: true }));
  server.use(cookieParser());

  // Health check endpoint
  server.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Auth: Register Endpoint
  server.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      await dbConnect();

      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        res.status(400).json({ error: 'Username is already taken' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const user = new User({
        username,
        password: hashedPassword,
      });
      await user.save();

      res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error during registration' });
    }
  });

  // Auth: Login Endpoint
  server.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      await dbConnect();

      // Find user
      const user = await User.findOne({ username });
      if (!user) {
        res.status(400).json({ error: 'Invalid username or password' });
        return;
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(400).json({ error: 'Invalid username or password' });
        return;
      }

      // Sign JWT
      const token = jwt.sign(
        { userId: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      res.status(200).json({ success: true, message: 'Logged in successfully' });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error during login' });
    }
  });

  // Auth: Logout Endpoint
  server.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });

  // Clients: Search suggestions Endpoint
  server.get('/api/clients/search', async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.token;
      if (!token) {
        res.status(401).json({ error: 'Unauthorized: No session token found' });
        return;
      }
      try {
        jwt.verify(token, JWT_SECRET);
      } catch (err) {
        res.status(401).json({ error: 'Unauthorized: Invalid session token' });
        return;
      }

      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        res.status(200).json([]);
        return;
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

      res.status(200).json(clients);
    } catch (error: any) {
      console.error('Error searching clients:', error);
      res.status(500).json({ error: 'Internal server error while searching clients' });
    }
  });

  // Clients: Get details by clientNo Endpoint
  server.get('/api/clients/:clientNo', async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.token;
      if (!token) {
        res.status(401).json({ error: 'Unauthorized: No session token found' });
        return;
      }
      try {
        jwt.verify(token, JWT_SECRET);
      } catch (err) {
        res.status(401).json({ error: 'Unauthorized: Invalid session token' });
        return;
      }

      const { clientNo } = req.params;
      if (!clientNo) {
        res.status(400).json({ error: 'Client Number is required' });
        return;
      }

      await dbConnect();
      const client = await Client.findOne({ clientNo });
      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      res.status(200).json(client);
    } catch (error: any) {
      console.error('Error fetching client details:', error);
      res.status(500).json({ error: 'Internal server error while fetching client details' });
    }
  });

  // Clients: Create/Update Client Endpoint
  server.post('/api/clients', async (req: Request, res: Response) => {
    try {
      // Validate JWT
      const token = req.cookies?.token;
      if (!token) {
        res.status(401).json({ error: 'Unauthorized: No session token found' });
        return;
      }

      try {
        jwt.verify(token, JWT_SECRET);
      } catch (err) {
        res.status(401).json({ error: 'Unauthorized: Invalid session token' });
        return;
      }

      const { clientNo, name, contactNo, alternativeNo, category, images, measurementDrawing, measurementDrawings, strokes, price } = req.body;

      if (!clientNo || !name || !contactNo || !category) {
        res.status(400).json({ error: 'Client No, Name, Contact No, and Category are required' });
        return;
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

      const uploadedMeasurementDrawing = await uploadToCloudinary(measurementDrawing);

      const uploadedMeasurementDrawings: string[] = [];
      if (measurementDrawings && Array.isArray(measurementDrawings)) {
        for (const img of measurementDrawings) {
          const url = await uploadToCloudinary(img);
          uploadedMeasurementDrawings.push(url);
        }
      }

      // Check if client exists
      const existingClient = await Client.findOne({ clientNo });
      if (existingClient) {
        // Update existing client
        existingClient.name = name;
        existingClient.contactNo = contactNo;
        existingClient.alternativeNo = alternativeNo;
        existingClient.category = category;
        existingClient.images = uploadedImages;
        existingClient.measurementDrawing = uploadedMeasurementDrawing;
        existingClient.measurementDrawings = uploadedMeasurementDrawings;
        existingClient.strokes = strokes || [];
        existingClient.price = parsedPrice;
        await existingClient.save();

        res.status(200).json({ success: true, message: 'Client measurements updated successfully', client: existingClient });
        return;
      }

      const client = new Client({
        clientNo,
        name,
        contactNo,
        alternativeNo,
        category,
        images: uploadedImages,
        measurementDrawing: uploadedMeasurementDrawing,
        measurementDrawings: uploadedMeasurementDrawings,
        strokes: strokes || [],
        price: parsedPrice,
      });

      await client.save();

      res.status(201).json({ success: true, message: 'Client registered successfully', client });
    } catch (error: any) {
      console.error('Error saving client:', error);
      res.status(500).json({ error: 'Internal server error while saving client' });
    }
  });

  // Clients: Update Suit Status Endpoint
  server.post('/api/clients/status', async (req: Request, res: Response) => {
    try {
      // Validate JWT
      const token = req.cookies?.token;
      if (!token) {
        res.status(401).json({ error: 'Unauthorized: No session token found' });
        return;
      }

      try {
        jwt.verify(token, JWT_SECRET);
      } catch (err) {
        res.status(401).json({ error: 'Unauthorized: Invalid session token' });
        return;
      }

      const { clientNo, status } = req.body;

      if (!clientNo || !status) {
        res.status(400).json({ error: 'Client Number and Status are required' });
        return;
      }

      const validStatuses = ['Pending', 'Prepared but not handovered', 'Completed and handovered'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
      }

      await dbConnect();

      const client = await Client.findOne({ clientNo });
      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      client.suitStatus = status;
      await client.save();

      res.status(200).json({ success: true, message: `Status updated to ${status} successfully`, client });
    } catch (error: any) {
      console.error('Error updating status:', error);
      res.status(500).json({ error: 'Internal server error while updating status' });
    }
  });

  // Let Next.js handle all other requests
  server.all(/.*/, (req: Request, res: Response) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} in ${dev ? 'development' : 'production'} mode`);
  });
}).catch((err) => {
  console.error('Error occurred preparing next app:', err);
  process.exit(1);
});
