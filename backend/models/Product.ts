import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    image: String,
    qrCode: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, name: 1 });
productSchema.index({ qrCode: 1 });

export default mongoose.model<IProduct>('Product', productSchema);
