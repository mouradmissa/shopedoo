import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStore extends Document {
  name: string;
  city: string;
  governorate: string;
  address: string;
  managerId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    governorate: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storeSchema.index({ governorate: 1, city: 1 });
storeSchema.index({ managerId: 1 }, { unique: true });

export default mongoose.model<IStore>('Store', storeSchema);
