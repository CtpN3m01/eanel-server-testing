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
jest.mock('@/models/LicenseRequest');
jest.mock('@/models/SubscriptionPlan');
jest.mock('@/models/User');

import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import LicenseRequest from '@/models/LicenseRequest';
import { PATCH } from '@/app/api/license-requests/[id]/route';

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockLicenseRequestFindById = LicenseRequest.findById as jest.MockedFunction<typeof LicenseRequest.findById>;

describe('PATCH /api/license-requests/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe actualizar exitosamente una solicitud de licencia cuando el usuario es propietario, el estado es pending y todos los campos requeridos son válidos', async () => {
    // Arrange
    const mockSession = { id: 'user123', email: 'user@test.com', role: 'user' };
    mockRequireAuth.mockResolvedValue(mockSession);
    mockDbConnect.mockResolvedValue({} as any);

    const mockLicenseRequest = {
      _id: 'lr123',
      userId: { toString: () => 'user123' },
      status: 'pending',
      firstName: 'OldName',
      lastName: 'OldLastName',
      accountIds: ['old-account'],
      reason: 'Old reason',
      save: jest.fn().mockResolvedValue(true),
    };

    const mockUpdatedRequest = {
      _id: 'lr123',
      userId: { _id: 'user123', name: 'Test User', email: 'user@test.com' },
      subscriptionPlanId: { _id: 'sp1', name: 'Basic Plan' },
      firstName: 'Juan',
      lastName: 'Pérez',
      accountIds: ['123456', '789012'],
      reason: 'Necesito licencia para operar en MT5',
      status: 'pending',
    };

    mockLicenseRequestFindById
      .mockResolvedValueOnce(mockLicenseRequest as any)
      .mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockUpdatedRequest),
          }),
        }),
      } as any);

    const req = {
      json: async () => ({
        firstName: 'Juan',
        lastName: 'Pérez',
        accountIds: ['123456', '789012'],
        reason: 'Necesito licencia para operar en MT5',
      }),
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'fake-token' }),
      },
    } as any;

    const params = Promise.resolve({ id: 'lr123' });

    // Act
    const res = await PATCH(req, { params });

    // Assert
    expect(mockRequireAuth).toHaveBeenCalled();
    expect(mockDbConnect).toHaveBeenCalled();
    expect(mockLicenseRequestFindById).toHaveBeenCalledWith('lr123');
    expect(mockLicenseRequest.save).toHaveBeenCalled();
    
    // Verificar que los campos se actualizaron correctamente
    expect(mockLicenseRequest.firstName).toBe('Juan');
    expect(mockLicenseRequest.lastName).toBe('Pérez');
    expect(mockLicenseRequest.accountIds).toEqual(['123456', '789012']);
    expect(mockLicenseRequest.reason).toBe('Necesito licencia para operar en MT5');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('License request updated successfully');
    expect(body.request).toBeDefined();
    expect(body.request.firstName).toBe('Juan');
    expect(body.request.lastName).toBe('Pérez');
  });

  test('debe retornar error 404 cuando la solicitud de licencia no existe', async () => {
    // Arrange
    const mockSession = { id: 'user123', email: 'user@test.com', role: 'user' };
    mockRequireAuth.mockResolvedValue(mockSession);
    mockDbConnect.mockResolvedValue({} as any);
    mockLicenseRequestFindById.mockResolvedValue(null);

    const req = {
      json: async () => ({
        firstName: 'Juan',
        lastName: 'Pérez',
        accountIds: ['123456'],
        reason: 'Test reason',
      }),
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'fake-token' }),
      },
    } as any;

    const params = Promise.resolve({ id: 'nonexistent-id' });

    // Act
    const res = await PATCH(req, { params });

    // Assert
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('License request not found');
  });

  test('debe retornar error 403 cuando el usuario intenta editar una solicitud que no le pertenece', async () => {
    // Arrange
    const mockSession = { id: 'user123', email: 'user@test.com', role: 'user' };
    mockRequireAuth.mockResolvedValue(mockSession);
    mockDbConnect.mockResolvedValue({} as any);

    const mockLicenseRequest = {
      _id: 'lr123',
      userId: { toString: () => 'different-user-456' }, // Usuario diferente
      status: 'pending',
      firstName: 'Test',
      lastName: 'User',
    };

    mockLicenseRequestFindById.mockResolvedValue(mockLicenseRequest as any);

    const req = {
      json: async () => ({
        firstName: 'Juan',
        lastName: 'Pérez',
        accountIds: ['123456'],
        reason: 'Test reason',
      }),
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'fake-token' }),
      },
    } as any;

    const params = Promise.resolve({ id: 'lr123' });

    // Act
    const res = await PATCH(req, { params });

    // Assert
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden: You can only edit your own requests');
  });

  test('debe retornar error 400 cuando la solicitud no está en estado pending', async () => {
    // Arrange
    const mockSession = { id: 'user123', email: 'user@test.com', role: 'user' };
    mockRequireAuth.mockResolvedValue(mockSession);
    mockDbConnect.mockResolvedValue({} as any);

    const mockLicenseRequest = {
      _id: 'lr123',
      userId: { toString: () => 'user123' },
      status: 'approved', // Estado no editable
      firstName: 'Test',
      lastName: 'User',
    };

    mockLicenseRequestFindById.mockResolvedValue(mockLicenseRequest as any);

    const req = {
      json: async () => ({
        firstName: 'Juan',
        lastName: 'Pérez',
        accountIds: ['123456'],
        reason: 'Test reason',
      }),
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'fake-token' }),
      },
    } as any;

    const params = Promise.resolve({ id: 'lr123' });

    // Act
    const res = await PATCH(req, { params });

    // Assert
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Cannot edit request after payment or processing');
  });

  test('debe retornar error 400 cuando falta el campo obligatorio firstName', async () => {
    // Arrange
    const mockSession = { id: 'user123', email: 'user@test.com', role: 'user' };
    mockRequireAuth.mockResolvedValue(mockSession);
    mockDbConnect.mockResolvedValue({} as any);

    const mockLicenseRequest = {
      _id: 'lr123',
      userId: { toString: () => 'user123' },
      status: 'pending',
      save: jest.fn(),
    };

    mockLicenseRequestFindById.mockResolvedValue(mockLicenseRequest as any);

    const req = {
      json: async () => ({
        // firstName missing
        lastName: 'Pérez',
        accountIds: ['123456'],
        reason: 'Test reason',
      }),
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'fake-token' }),
      },
    } as any;

    const params = Promise.resolve({ id: 'lr123' });

    // Act
    const res = await PATCH(req, { params });

    // Assert
    expect(mockLicenseRequest.save).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('All fields are required');
  });

  test('debe retornar error 400 cuando accountIds está vacío o no es un array', async () => {
    // Arrange
    const mockSession = { id: 'user123', email: 'user@test.com', role: 'user' };
    mockRequireAuth.mockResolvedValue(mockSession);
    mockDbConnect.mockResolvedValue({} as any);

    const mockLicenseRequest = {
      _id: 'lr123',
      userId: { toString: () => 'user123' },
      status: 'pending',
      save: jest.fn(),
    };

    mockLicenseRequestFindById.mockResolvedValue(mockLicenseRequest as any);

    const req = {
      json: async () => ({
        firstName: 'Juan',
        lastName: 'Pérez',
        accountIds: [], // Array vacío
        reason: 'Test reason',
      }),
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'fake-token' }),
      },
    } as any;

    const params = Promise.resolve({ id: 'lr123' });

    // Act
    const res = await PATCH(req, { params });

    // Assert
    expect(mockLicenseRequest.save).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('At least one account ID is required');
  });

  test('debe normalizar correctamente los campos firstName, lastName y reason eliminando espacios adicionales', async () => {
    // Arrange
    const mockSession = { id: 'user123', email: 'user@test.com', role: 'user' };
    mockRequireAuth.mockResolvedValue(mockSession);
    mockDbConnect.mockResolvedValue({} as any);

    const mockLicenseRequest = {
      _id: 'lr123',
      userId: { toString: () => 'user123' },
      status: 'pending',
      firstName: '',
      lastName: '',
      accountIds: [],
      reason: '',
      save: jest.fn().mockResolvedValue(true),
    };

    const mockUpdatedRequest = {
      _id: 'lr123',
      firstName: 'Juan',
      lastName: 'Pérez',
      reason: 'Necesito licencia',
    };

    mockLicenseRequestFindById
      .mockResolvedValueOnce(mockLicenseRequest as any)
      .mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockUpdatedRequest),
          }),
        }),
      } as any);

    const req = {
      json: async () => ({
        firstName: '  Juan  ', // Con espacios extras
        lastName: '  Pérez  ',
        accountIds: ['123456'],
        reason: '  Necesito licencia  ',
      }),
      cookies: {
        get: jest.fn().mockReturnValue({ value: 'fake-token' }),
      },
    } as any;

    const params = Promise.resolve({ id: 'lr123' });

    // Act
    const res = await PATCH(req, { params });

    // Assert
    expect(mockLicenseRequest.firstName).toBe('Juan'); // Sin espacios
    expect(mockLicenseRequest.lastName).toBe('Pérez');
    expect(mockLicenseRequest.reason).toBe('Necesito licencia');
    expect(res.status).toBe(200);
  });
});
