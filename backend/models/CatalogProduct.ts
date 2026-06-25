import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICatalogProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  imageData?: Buffer;
  imageMimeType?: string;
  imageStored?: boolean;
  createdBy?: Types.ObjectId;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const catalogProductSchema = new Schema<ICatalogProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    image: String,
    imageData: { type: Buffer },
    imageMimeType: { type: String, default: 'image/jpeg' },
    imageStored: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    stock: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

catalogProductSchema.index({ category: 1, name: 1 });
catalogProductSchema.index({ isActive: 1 });

export default mongoose.model<ICatalogProduct>('CatalogProduct', catalogProductSchema);
