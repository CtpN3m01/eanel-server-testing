/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock jose before any other imports
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('fake-jwt-token-123'),
  })),
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock modules before importing
jest.mock('@/lib/mongodb');
jest.mock('@/models/User');
jest.mock('@/lib/auth');

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { GET } from '@/app/api/auth/me/route';

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockUserFindById = User.findById as jest.MockedFunction<any>;

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe retornar los datos del usuario autenticado sin incluir la contraseña cuando la sesión es válida', async () => {
    // Arrange
    const mockSession = {
      id: 'user123',
      email: 'usuario@test.com',
      role: 'user',
    };

    const mockUser = {
      _id: 'user123',
      email: 'usuario@test.com',
      name: 'Usuario Test',
      role: 'user',
      password: '$2a$10$shouldnotbeincluded', // No debe ser retornado
    };

    const mockSelectChain = {
      select: jest.fn().mockResolvedValue(mockUser),
    };

    mockGetSession.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindById.mockReturnValue(mockSelectChain);

    // Act
    const res = await GET();

    // Assert
    expect(mockGetSession).toHaveBeenCalled();
    expect(mockDbConnect).toHaveBeenCalled();
    expect(mockUserFindById).toHaveBeenCalledWith('user123');
    expect(mockSelectChain.select).toHaveBeenCalledWith('-password');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.id).toBe('user123');
    expect(body.user.email).toBe('usuario@test.com');
    expect(body.user.name).toBe('Usuario Test');
    expect(body.user.role).toBe('user');
    expect(body.user.password).toBeUndefined();
  });

  test('debe retornar error 401 con mensaje Unauthorized cuando no existe sesión activa o token JWT', async () => {
    // Arrange
    mockGetSession.mockResolvedValue(null); // No hay sesión

    // Act
    const res = await GET();

    // Assert
    expect(mockGetSession).toHaveBeenCalled();
    expect(mockDbConnect).not.toHaveBeenCalled();
    expect(mockUserFindById).not.toHaveBeenCalled();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  test('debe retornar error 404 cuando el usuario autenticado no existe en la base de datos', async () => {
    // Arrange
    const mockSession = {
      id: 'deleteduser123',
      email: 'deleted@test.com',
      role: 'user',
    };

    const mockSelectChain = {
      select: jest.fn().mockResolvedValue(null), // Usuario no encontrado
    };

    mockGetSession.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindById.mockReturnValue(mockSelectChain);

    // Act
    const res = await GET();

    // Assert
    expect(mockGetSession).toHaveBeenCalled();
    expect(mockDbConnect).toHaveBeenCalled();
    expect(mockUserFindById).toHaveBeenCalledWith('deleteduser123');

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('User not found');
  });

  test('debe retornar los datos correctos cuando el usuario autenticado es administrador', async () => {
    // Arrange
    const mockSession = {
      id: 'admin123',
      email: 'admin@test.com',
      role: 'admin',
    };

    const mockAdmin = {
      _id: 'admin123',
      email: 'admin@test.com',
      name: 'Administrador',
      role: 'admin',
    };

    const mockSelectChain = {
      select: jest.fn().mockResolvedValue(mockAdmin),
    };

    mockGetSession.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindById.mockReturnValue(mockSelectChain);

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.role).toBe('admin');
    expect(body.user.email).toBe('admin@test.com');
  });

  test('debe excluir explícitamente el campo password usando select(-password) en la consulta a MongoDB', async () => {
    // Arrange
    const mockSession = {
      id: 'user456',
      email: 'secure@test.com',
      role: 'user',
    };

    const mockUser = {
      _id: 'user456',
      email: 'secure@test.com',
      name: 'Secure User',
      role: 'user',
    };

    const mockSelectChain = {
      select: jest.fn().mockResolvedValue(mockUser),
    };

    mockGetSession.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindById.mockReturnValue(mockSelectChain);

    // Act
    await GET();

    // Assert
    expect(mockSelectChain.select).toHaveBeenCalledWith('-password');
  });

  test('debe retornar error 500 sin exponer detalles técnicos cuando falla la consulta a la base de datos', async () => {
    // Arrange
    const mockSession = {
      id: 'user789',
      email: 'error@test.com',
      role: 'user',
    };

    mockGetSession.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue({} as any);
    
    const mockSelectChain = {
      select: jest.fn().mockRejectedValue(new Error('Database query failed')),
    };
    
    mockUserFindById.mockReturnValue(mockSelectChain);

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
    expect(body.error).not.toContain('Database');
    expect(body.error).not.toContain('query');
  });

  test('debe retornar error 500 cuando getSession lanza una excepción inesperada', async () => {
    // Arrange
    mockGetSession.mockRejectedValue(new Error('JWT verification failed'));

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
    expect(body.error).not.toContain('JWT');
  });

  test('debe retornar únicamente los campos id, email, name y role en la respuesta JSON', async () => {
    // Arrange
    const mockSession = {
      id: 'user999',
      email: 'limited@test.com',
      role: 'user',
    };

    const mockUser = {
      _id: 'user999',
      email: 'limited@test.com',
      name: 'Limited User',
      role: 'user',
      password: '$2a$10$hash',
      internalField: 'should-not-appear',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSelectChain = {
      select: jest.fn().mockResolvedValue(mockUser),
    };

    mockGetSession.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindById.mockReturnValue(mockSelectChain);

    // Act
    const res = await GET();

    // Assert
    const body = await res.json();
    expect(Object.keys(body.user)).toEqual(['id', 'email', 'name', 'role']);
    expect(body.user.password).toBeUndefined();
    expect(body.user.internalField).toBeUndefined();
    expect(body.user.createdAt).toBeUndefined();
  });

  test('debe conectarse a la base de datos después de validar la sesión pero antes de consultar el usuario', async () => {
    // Arrange
    const mockSession = {
      id: 'ordertest123',
      email: 'order@test.com',
      role: 'user',
    };

    const mockUser = {
      _id: 'ordertest123',
      email: 'order@test.com',
      name: 'Order Test',
      role: 'user',
    };

    const mockSelectChain = {
      select: jest.fn().mockResolvedValue(mockUser),
    };

    const callOrder: string[] = [];

    mockGetSession.mockImplementation(async () => {
      callOrder.push('getSession');
      return mockSession as any;
    });

    mockDbConnect.mockImplementation(async () => {
      callOrder.push('dbConnect');
      return {} as any;
    });

    mockUserFindById.mockImplementation(() => {
      callOrder.push('findById');
      return mockSelectChain;
    });

    // Act
    await GET();

    // Assert
    expect(callOrder).toEqual(['getSession', 'dbConnect', 'findById']);
  });

  test('debe validar que el id de sesión coincide con el id del usuario retornado de la base de datos', async () => {
    // Arrange
    const mockSession = {
      id: 'matchtest123',
      email: 'match@test.com',
      role: 'user',
    };

    const mockUser = {
      _id: 'matchtest123', // Mismo ID que la sesión
      email: 'match@test.com',
      name: 'Match Test',
      role: 'user',
    };

    const mockSelectChain = {
      select: jest.fn().mockResolvedValue(mockUser),
    };

    mockGetSession.mockResolvedValue(mockSession as any);
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindById.mockReturnValue(mockSelectChain);

    // Act
    const res = await GET();

    // Assert
    expect(mockUserFindById).toHaveBeenCalledWith('matchtest123');
    const body = await res.json();
    expect(body.user.id).toBe('matchtest123');
  });
});
