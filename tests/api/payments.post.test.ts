/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock jose before any other imports
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(),
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock modules before importing
jest.mock('@/lib/auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/Payment');
jest.mock('@/models/LicenseRequest');
jest.mock('@/models/SubscriptionPlan');
jest.mock('@/models/PaymentMethod');
jest.mock('@/models/User');

import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import LicenseRequest from '@/models/LicenseRequest';
import { POST } from '@/app/api/payments/route';

const mockVerifyAuth = verifyAuth as jest.MockedFunction<typeof verifyAuth>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockPaymentCreate = Payment.create as jest.MockedFunction<typeof Payment.create>;
const mockLicenseRequestUpdate = LicenseRequest.findByIdAndUpdate as jest.MockedFunction<typeof LicenseRequest.findByIdAndUpdate>;

describe('POST /api/payments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe crear un registro de pago exitosamente cuando todos los campos requeridos son válidos y actualizar el estado de la solicitud de licencia a pending_payment', async () => {
    // Arrange
    mockVerifyAuth.mockResolvedValue({ id: 'user1', email: 'user@test.com', role: 'user' });
    mockConnectDB.mockResolvedValue({} as any);

    const fakePayment = {
      _id: 'pay123',
      userId: 'user1',
      licenseRequestId: 'lr1',
      subscriptionPlanId: 'sp1',
      amount: 10,
      currency: 'USD',
      paymentMethodId: 'pm1',
      paymentProof: 'proof-url',
      transactionReference: 'tx1',
      status: 'pending',
    };

    mockPaymentCreate.mockResolvedValue(fakePayment as any);
    mockLicenseRequestUpdate.mockResolvedValue({} as any);

    const req = {
      json: async () => ({
        licenseRequestId: 'lr1',
        subscriptionPlanId: 'sp1',
        amount: 10,
        currency: 'USD',
        paymentMethodId: 'pm1',
        paymentProof: 'proof-url',
        transactionReference: 'tx1',
      }),
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'fake-token' }),
      },
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockVerifyAuth).toHaveBeenCalled();
    expect(mockConnectDB).toHaveBeenCalled();
    expect(mockPaymentCreate).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user1',
      licenseRequestId: 'lr1',
      subscriptionPlanId: 'sp1',
      amount: 10,
      currency: 'USD',
      paymentMethodId: 'pm1',
      paymentProof: 'proof-url',
      transactionReference: 'tx1',
      status: 'pending',
    }));

    expect(mockLicenseRequestUpdate).toHaveBeenCalledWith('lr1', {
      paymentId: fakePayment._id,
      status: 'pending_payment',
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.payment).toBeDefined();
    expect(body.payment._id).toBe('pay123');
  });

  test('debe retornar error 400 y no crear ningún registro cuando falta el campo obligatorio paymentProof', async () => {
    mockVerifyAuth.mockResolvedValue({ id: 'user1', email: 'user@test.com', role: 'user' });
    mockConnectDB.mockResolvedValue({} as any);

    const req = {
      json: async () => ({
        // missing paymentProof
        licenseRequestId: 'lr1',
        subscriptionPlanId: 'sp1',
        amount: 10,
        paymentMethodId: 'pm1',
      }),
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'fake-token' }),
      },
    } as any;

    const res = await POST(req);

    expect(mockPaymentCreate).not.toHaveBeenCalled();
    expect(mockLicenseRequestUpdate).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
