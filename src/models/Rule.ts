import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRule extends Document {
  title: string;
  description: string;
  category: 'body' | 'clothing' | 'general' | 'behavior';
  penalty: string;
}

const RuleSchema = new Schema<IRule>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['body', 'clothing', 'general', 'behavior'], 
    required: true 
  },
  penalty: { type: String, required: true },
});

const Rule: Model<IRule> = mongoose.models.Rule || mongoose.model<IRule>('Rule', RuleSchema);
export default Rule;
