import mongoose, { Schema } from 'mongoose';

export interface IPaymentMethod extends mongoose.Document {
  name: string;
  type: 'bank_transfer' | 'crypto' | 'paypal' | 'zelle' | 'binance' | 'binance_pay_qr' | 'airtm' | 'skrill' | 'sinpe' | 'other';
  details: Record<string, unknown>;
  isActive: boolean;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema({
  type: {
    type: String,
    enum: ['bank_transfer', 'crypto', 'paypal', 'zelle', 'binance', 'binance_pay_qr', 'airtm', 'skrill', 'sinpe', 'other'],
    required: true,
  },
  name: { type: String, required: true },
  details: { type: Schema.Types.Mixed, required: true },
  instructions: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Evitar el error de modelo ya compilado en desarrollo
if (mongoose.models.PaymentMethod) {
  delete mongoose.models.PaymentMethod;
}

export default mongoose.model<IPaymentMethod>('PaymentMethod', paymentMethodSchema);
