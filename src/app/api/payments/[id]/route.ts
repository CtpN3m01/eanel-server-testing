import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import LicenseRequest from '@/models/LicenseRequest';
import License from '@/models/License';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import PaymentMethod from '@/models/PaymentMethod';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import crypto from 'crypto';

// GET - Obtener un pago específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const payment = await Payment.findById(id)
      .populate('userId', 'name email')
      .populate('subscriptionPlanId')
      .populate('paymentMethodId')
      .populate('licenseRequestId');

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Los usuarios solo pueden ver sus propios pagos
    if (user.role !== 'admin' && payment.userId.toString() !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

// PUT - Verificar o rechazar pago (solo admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Asegurar que los modelos estén registrados
    void SubscriptionPlan;
    void PaymentMethod;
    void User;
    void LicenseRequest;
    void License;

    const body = await request.json();
    const { action, rejectionReason, expiryDate } = body;

    if (!action || !['verify', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "verify" or "reject"' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const payment = await Payment.findById(id).populate('licenseRequestId subscriptionPlanId');

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (action === 'verify') {
      // Verificar el pago
      payment.status = 'verified';
      payment.verifiedBy = user.id as unknown as typeof payment.verifiedBy;
      payment.verifiedAt = new Date();
      await payment.save();

      // Obtener la solicitud de licencia
      const licenseRequest = await LicenseRequest.findById(payment.licenseRequestId);
      
      if (licenseRequest) {
        // Actualizar estado de la solicitud
        licenseRequest.status = 'payment_verified';
        await licenseRequest.save();

        // Si se proporciona expiryDate, crear la licencia automáticamente
        if (expiryDate) {
          // Generar license key
          const licenseKey = crypto.randomBytes(16).toString('hex').toUpperCase();

          const license = await License.create({
            licenseKey,
            firstName: licenseRequest.firstName,
            lastName: licenseRequest.lastName,
            accountIds: licenseRequest.accountIds,
            expiryDate: new Date(expiryDate),
            status: 'active',
          });

          // Marcar la solicitud como aprobada
          licenseRequest.status = 'approved';
          licenseRequest.approvedBy = user.id as unknown as typeof licenseRequest.approvedBy;
          licenseRequest.approvedAt = new Date();
          await licenseRequest.save();

          return NextResponse.json({
            payment,
            licenseRequest,
            license,
            message: 'Payment verified and license created successfully',
          });
        }
      }

      return NextResponse.json({
        payment,
        message: 'Payment verified successfully',
      });
    } else {
      // Rechazar el pago
      payment.status = 'rejected';
      payment.rejectionReason = rejectionReason || 'Payment verification failed';
      await payment.save();

      // Actualizar la solicitud
      const licenseRequest = await LicenseRequest.findById(payment.licenseRequestId);
      if (licenseRequest) {
        licenseRequest.status = 'rejected';
        licenseRequest.rejectedBy = user.id as unknown as typeof licenseRequest.rejectedBy;
        licenseRequest.rejectedAt = new Date();
        licenseRequest.adminNotes = rejectionReason || 'Payment rejected';
        await licenseRequest.save();
      }

      return NextResponse.json({
        payment,
        message: 'Payment rejected',
      });
    }
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
