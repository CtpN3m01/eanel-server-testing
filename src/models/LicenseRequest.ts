import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILicenseRequest extends Document {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  accountIds: string[];
  reason: string;
  subscriptionPlanId?: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'pending_payment' | 'payment_verified';
  adminNotes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseRequestSchema: Schema<ILicenseRequest> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    accountIds: {
      type: [String],
      required: [true, 'At least one account ID is required'],
      validate: {
        validator: function(arr: string[]) {
          return arr && arr.length > 0;
        },
        message: 'At least one account ID is required',
      },
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    subscriptionPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'pending_payment', 'payment_verified'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Eliminar el modelo del caché si existe para forzar recreación
if (mongoose.models.LicenseRequest) {
  delete mongoose.models.LicenseRequest;
}

const LicenseRequest: Model<ILicenseRequest> = mongoose.model<ILicenseRequest>('LicenseRequest', LicenseRequestSchema);

export default LicenseRequest;
