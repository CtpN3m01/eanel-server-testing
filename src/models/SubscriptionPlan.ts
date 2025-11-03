import mongoose from 'mongoose';

export interface ISubscriptionPlan extends mongoose.Document {
  name: string;
  duration: number; // en meses
  price: number;
  currency: string;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new mongoose.Schema<ISubscriptionPlan>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Evitar el error de modelo ya compilado en desarrollo
delete mongoose.models.SubscriptionPlan;

export default mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
