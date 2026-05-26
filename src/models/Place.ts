import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlace extends Document {
  title: string;
  description: string;
  city: 'Mekke' | 'Medine';
  importance: string;
  order: number;
}

const PlaceSchema = new Schema<IPlace>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  city: { type: String, enum: ['Mekke', 'Medine'], required: true },
  importance: { type: String, required: true },
  order: { type: Number, default: 0 },
});

const Place: Model<IPlace> = mongoose.models.Place || mongoose.model<IPlace>('Place', PlaceSchema);
export default Place;
