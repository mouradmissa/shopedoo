import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  storeId?: Types.ObjectId;
  qrCode: string;
  qrCodeImage?: string;
  qrCodePayload?: string;
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
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    qrCode: { type: String, unique: true, sparse: true },
    qrCodeImage: String,
    qrCodePayload: String,
  },
  { timestamps: true }
);

productSchema.index({ category: 1, name: 1 });
productSchema.index({ storeId: 1, name: 1 });
productSchema.index({ qrCode: 1 });

export default mongoose.model<IProduct>('Product', productSchema);
