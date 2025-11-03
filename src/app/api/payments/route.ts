import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import LicenseRequest from '@/models/LicenseRequest';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import PaymentMethod from '@/models/PaymentMethod';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// GET - Obtener pagos (admin ve todos, user ve los suyos)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Asegurar que los modelos estén registrados
    void SubscriptionPlan;
    void PaymentMethod;
    void User;
    void LicenseRequest;

    let query = {};
    if (user.role !== 'admin') {
      query = { userId: user.id };
    }

    const payments = await Payment.find(query)
      .populate('userId', 'name email')
      .populate('subscriptionPlanId')
      .populate('paymentMethodId')
      .populate('licenseRequestId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST - Crear un pago (registro de comprobante)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      licenseRequestId,
      subscriptionPlanId,
      amount,
      currency,
      paymentMethodId,
      paymentProof,
      transactionReference,
    } = body;

    if (!licenseRequestId || !subscriptionPlanId || !amount || !paymentMethodId || !paymentProof) {
      return NextResponse.json(
        { error: 'All payment fields are required' },
        { status: 400 }
      );
    }

    // Crear el pago
    const payment = await Payment.create({
      userId: user.id,
      licenseRequestId,
      subscriptionPlanId,
      amount,
      currency: currency || 'USD',
      paymentMethodId,
      paymentProof,
      transactionReference,
      status: 'pending',
    });

    // Actualizar la solicitud de licencia
    await LicenseRequest.findByIdAndUpdate(licenseRequestId, {
      paymentId: payment._id,
      status: 'pending_payment',
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
