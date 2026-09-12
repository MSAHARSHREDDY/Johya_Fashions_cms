import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  minAmount: number;
  basePoints: number;
  incrementAmount: number;
  pointsPerIncrement: number;
  updatedAt: Date;
}

const SettingSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'point_settings' },
    minAmount: { type: Number, required: true, default: 1000 },
    basePoints: { type: Number, required: true, default: 50 },
    incrementAmount: { type: Number, required: true, default: 500 },
    pointsPerIncrement: { type: Number, required: true, default: 50 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISetting>('Setting', SettingSchema);
