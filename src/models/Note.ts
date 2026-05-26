import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INote extends Document {
  text: string;
  completed: boolean;
  createdAt: Date;
}

const NoteSchema = new Schema<INote>({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
export default Note;
