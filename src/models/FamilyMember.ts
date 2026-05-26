import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFamilyMember extends Document {
  groupCode: string;
  deviceId: string;
  name: string;
  latitude: number;
  longitude: number;
  updatedAt: Date;
}

const FamilyMemberSchema = new Schema<IFamilyMember>({
  groupCode: { type: String, required: true, uppercase: true, trim: true },
  deviceId: { type: String, required: true },
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now, index: { expires: '24h' } } // Auto-expires after 24h
});

// Compound index for uniqueness of a user inside a specific family group
FamilyMemberSchema.index({ groupCode: 1, deviceId: 1 }, { unique: true });

const FamilyMember: Model<IFamilyMember> = mongoose.models.FamilyMember || mongoose.model<IFamilyMember>('FamilyMember', FamilyMemberSchema);
export default FamilyMember;
