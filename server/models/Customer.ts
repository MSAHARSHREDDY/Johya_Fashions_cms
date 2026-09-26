import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchase {
  date: Date;
  amount: number;
  categories: string[];
  rewardsEarned: number;
}

export interface ICustomer extends Document {
  name: string;
  phoneNumber: string;
  lastPurchaseDate: Date;
  categories: string[];
  price: number; // Total price
  rewards: number; // Total rewards balance
  redeemedRewards: number; // Total rewards redeemed
  visits: number; // Total visits
  purchaseHistory: IPurchase[];
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  categories: { type: [String], required: true },
  rewardsEarned: { type: Number, required: true },
});

const CustomerSchema: Schema = new Schema(
  {
    name: { type: String, required: true, index: true },
    phoneNumber: { type: String, required: true, index: true, unique: true },
    lastPurchaseDate: { type: Date, required: true, index: true },
    categories: { type: [String], required: true, index: true },
    price: { type: Number, required: true, default: 0 },
    rewards: { type: Number, required: true, default: 0 },
    redeemedRewards: { type: Number, required: true, default: 0 },
    visits: { type: Number, required: true, default: 1 },
    purchaseHistory: { type: [PurchaseSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Search index for name and phone
CustomerSchema.index({ name: 'text', phoneNumber: 'text' });

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
