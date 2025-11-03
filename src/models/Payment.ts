import mongoose from 'mongoose';

export interface IPayment extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  licenseRequestId: mongoose.Types.ObjectId;
  subscriptionPlanId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethodId: mongoose.Types.ObjectId;
  paymentProof: string; // URL del comprobante
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  transactionReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new mongoose.Schema<IPayment>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    licenseRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LicenseRequest',
      required: true,
    },
    subscriptionPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    paymentMethodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      required: true,
    },
    paymentProof: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    transactionReference: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Evitar el error de modelo ya compilado en desarrollo
delete mongoose.models.Payment;

export default mongoose.model<IPayment>('Payment', paymentSchema);
