import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'admin' | 'superadmin';

export interface IUser extends Document {
  username: string;
  name: string;
  email?: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'superadmin'], required: true, default: 'admin' },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
