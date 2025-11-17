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
jest.mock('@/lib/mongodb');
jest.mock('@/models/License');

import dbConnect from '@/lib/mongodb';
import License from '@/models/License';
import { POST } from '@/app/api/mql5/validate-account/route';

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockLicenseFindOne = License.findOne as jest.MockedFunction<typeof License.findOne>;

describe('POST /api/mql5/validate-account', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe validar exitosamente una cuenta con licencia activa y devolver los metadatos completos incluyendo días restantes y estado de expiración', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    // Crear una fecha de expiración 30 días en el futuro
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const mockLicense = {
      _id: 'lic123',
      licenseKey: 'ABC123-DEF456-GHI789',
      firstName: 'Juan',
      lastName: 'Pérez',
      accountIds: ['123456789', '987654321'],
      expiryDate: futureDate,
      status: 'active',
    };

    mockLicenseFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockLicense),
    } as any);

    const req = {
      json: async () => ({
        account_id: '123456789',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockDbConnect).toHaveBeenCalled();
    expect(mockLicenseFindOne).toHaveBeenCalledWith({
      accountIds: '123456789',
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.license).toBeDefined();
    expect(body.license.licenseKey).toBe('ABC123-DEF456-GHI789');
    expect(body.license.firstName).toBe('Juan');
    expect(body.license.lastName).toBe('Pérez');
    expect(body.license.fullName).toBe('Juan Pérez');
    expect(body.license.isActive).toBe(true);
    expect(body.license.isExpired).toBe(false);
    expect(body.license.status).toBe('active');
    expect(body.license.daysRemaining).toBeGreaterThan(0);
    expect(body.license.accountIds).toEqual(['123456789', '987654321']);
  });

  test('debe retornar error 400 cuando no se proporciona el campo obligatorio account_id', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const req = {
      json: async () => ({
        // account_id missing
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockLicenseFindOne).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('account_id is required');
  });

  test('debe retornar error 404 cuando no existe ninguna licencia asociada al account_id proporcionado', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);
    mockLicenseFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    } as any);

    const req = {
      json: async () => ({
        account_id: 'nonexistent-account',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockDbConnect).toHaveBeenCalled();
    expect(mockLicenseFindOne).toHaveBeenCalledWith({
      accountIds: 'nonexistent-account',
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('No license found for this account_id');
    expect(body.isActive).toBe(false);
  });

  test('debe identificar correctamente una licencia expirada cuando la fecha de expiración es anterior a la fecha actual y devolver isActive como false', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    // Crear una fecha de expiración 10 días en el pasado
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    const mockExpiredLicense = {
      _id: 'lic456',
      licenseKey: 'EXPIRED-123',
      firstName: 'María',
      lastName: 'González',
      accountIds: ['555555555'],
      expiryDate: pastDate,
      status: 'active',
    };

    mockLicenseFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockExpiredLicense),
    } as any);

    const req = {
      json: async () => ({
        account_id: '555555555',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.license.isExpired).toBe(true);
    expect(body.license.isActive).toBe(false);
    expect(body.license.daysRemaining).toBe(0);
    expect(body.license.status).toBe('active'); // El status en DB sigue siendo active
  });

  test('debe identificar licencia inactiva cuando el status no es active incluso si no está expirada por fecha', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    // Fecha futura pero status suspendido
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const mockSuspendedLicense = {
      _id: 'lic789',
      licenseKey: 'SUSPENDED-456',
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      accountIds: ['777777777'],
      expiryDate: futureDate,
      status: 'suspended',
    };

    mockLicenseFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockSuspendedLicense),
    } as any);

    const req = {
      json: async () => ({
        account_id: '777777777',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.license.isExpired).toBe(false);
    expect(body.license.isActive).toBe(false); // No activa por status
    expect(body.license.status).toBe('suspended');
    expect(body.license.daysRemaining).toBeGreaterThan(0);
  });

  test('debe calcular correctamente los días restantes cuando la licencia está próxima a expirar', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    // Crear una fecha de expiración en 5 días
    const soonToExpire = new Date();
    soonToExpire.setDate(soonToExpire.getDate() + 5);

    const mockLicense = {
      _id: 'lic999',
      licenseKey: 'SOON-EXPIRE-123',
      firstName: 'Ana',
      lastName: 'Martínez',
      accountIds: ['888888888'],
      expiryDate: soonToExpire,
      status: 'active',
    };

    mockLicenseFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockLicense),
    } as any);

    const req = {
      json: async () => ({
        account_id: '888888888',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.license.isActive).toBe(true);
    expect(body.license.isExpired).toBe(false);
    expect(body.license.daysRemaining).toBeGreaterThanOrEqual(4);
    expect(body.license.daysRemaining).toBeLessThanOrEqual(6);
  });

  test('debe permitir validar cualquier account_id que esté en el array accountIds de la licencia', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const mockLicense = {
      _id: 'lic111',
      licenseKey: 'MULTI-ACCOUNT-789',
      firstName: 'Pedro',
      lastName: 'López',
      accountIds: ['111111111', '222222222', '333333333'],
      expiryDate: futureDate,
      status: 'active',
    };

    // Simular búsqueda del segundo account_id
    mockLicenseFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockLicense),
    } as any);

    const req = {
      json: async () => ({
        account_id: '222222222', // Segundo ID del array
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockLicenseFindOne).toHaveBeenCalledWith({
      accountIds: '222222222',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.license.accountIds).toContain('222222222');
    expect(body.license.isActive).toBe(true);
  });

  test('debe retornar error 500 y success false cuando ocurre un error interno en la base de datos sin exponer detalles técnicos', async () => {
    // Arrange
    mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

    const req = {
      json: async () => ({
        account_id: '999999999',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.isActive).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error).not.toContain('stack'); // No debe exponer stack trace
  });

  test('debe convertir account_id a string correctamente cuando se recibe en formato numérico', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const mockLicense = {
      _id: 'lic222',
      licenseKey: 'NUMERIC-ID-456',
      firstName: 'Laura',
      lastName: 'Fernández',
      accountIds: ['123456'],
      expiryDate: futureDate,
      status: 'active',
    };

    mockLicenseFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockLicense),
    } as any);

    const req = {
      json: async () => ({
        account_id: 123456, // Número en lugar de string
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockLicenseFindOne).toHaveBeenCalledWith({
      accountIds: '123456', // Debe convertirse a string
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
