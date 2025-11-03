import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILicense extends Document {
  licenseKey: string;
  status: 'active' | 'inactive' | 'expired';
  expiryDate: Date;
  accountIds: string[];
  firstName: string;
  lastName: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseSchema: Schema<ILicense> = new Schema(
  {
    licenseKey: {
      type: String,
      required: [true, 'License key is required'],
      unique: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active',
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    accountIds: {
      type: [String],
      default: [],
      required: [true, 'At least one account ID is required'],
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
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Eliminar el modelo del caché si existe para forzar recreación
if (mongoose.models.License) {
  delete mongoose.models.License;
}

const License: Model<ILicense> = mongoose.model<ILicense>('License', LicenseSchema);

export default License;
