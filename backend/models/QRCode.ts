import mongoose, { Schema, Document } from 'mongoose';

export interface IQRCode extends Document {
  productId: mongoose.Types.ObjectId;
  code: string;
  scans: number;
  lastScannedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const qrCodeSchema = new Schema<IQRCode>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    code: { type: String, required: true, unique: true },
    scans: { type: Number, default: 0 },
    lastScannedAt: Date,
  },
  { timestamps: true }
);

qrCodeSchema.index({ productId: 1 });
qrCodeSchema.index({ code: 1 });

export default mongoose.model<IQRCode>('QRCode', qrCodeSchema);
