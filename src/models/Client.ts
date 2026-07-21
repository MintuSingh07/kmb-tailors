import mongoose, { Schema } from 'mongoose';

const ClientSchema = new Schema(
  {
    clientNo: {
      type: String,
      required: [true, 'Please provide a client number'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a client name'],
      trim: true,
    },
    contactNo: {
      type: String,
      required: [true, 'Please provide a contact number'],
      trim: true,
    },
    alternativeNo: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true,
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    suitStatus: {
      type: String,
      enum: ['Pending', 'Prepared but not handovered', 'Completed and handovered'],
      default: 'Pending',
    },
    images: {
      type: [String], // Array of Base64 strings or fabric image urls
      default: [],
    },
    handoverImages: {
      type: [String], // Array of Base64 strings or handover image urls
      default: [],
    },
    measurementDrawing: {
      type: String, // Base64 string of drawing
      default: '',
    },
    measurementDrawings: {
      type: [String], // Array of Base64 strings for multi-page drawings
      default: [],
    },
    strokes: {
      type: Array, // Array of Stroke objects for rebuilding canvas
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Delete cached model in development to prevent schema caching issues on hot reload
if (process.env.NODE_ENV === 'development' && mongoose.models.Client) {
  delete mongoose.models.Client;
}

const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);

export default Client;
