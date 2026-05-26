import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPrayer extends Document {
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  category: 'ihram' | 'tawaf' | 'say' | 'general' | 'visit' | 'risale';
  order: number;
}

const PrayerSchema = new Schema<IPrayer>({
  title: { type: String, required: true },
  arabic: { type: String, required: true },
  transliteration: { type: String, required: true },
  translation: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['ihram', 'tawaf', 'say', 'general', 'visit', 'risale'], 
    required: true 
  },
  order: { type: Number, default: 0 },
});

const Prayer: Model<IPrayer> = mongoose.models.Prayer || mongoose.model<IPrayer>('Prayer', PrayerSchema);
export default Prayer;
