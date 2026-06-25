import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  imageData?: Buffer;
  imageMimeType?: string;
  imageStored?: boolean;
  storeId?: Types.ObjectId;
  catalogProductId?: Types.ObjectId;
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
    imageData: { type: Buffer },
    imageMimeType: { type: String, default: 'image/jpeg' },
    imageStored: { type: Boolean, default: false },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    catalogProductId: { type: Schema.Types.ObjectId, ref: 'CatalogProduct' },
    qrCode: { type: String, unique: true, sparse: true },
    qrCodeImage: String,
    qrCodePayload: String,
  },
  { timestamps: true }
);

productSchema.index({ category: 1, name: 1 });
productSchema.index({ storeId: 1, name: 1 });
productSchema.index({ catalogProductId: 1, storeId: 1 });
productSchema.index({ qrCode: 1 });

export default mongoose.model<IProduct>('Product', productSchema);
