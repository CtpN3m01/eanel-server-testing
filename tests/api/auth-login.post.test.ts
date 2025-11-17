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
jest.mock('bcryptjs');
jest.mock('@/lib/auth');

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { POST } from '@/app/api/auth/login/route';

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockUserFindOne = User.findOne as jest.MockedFunction<typeof User.findOne>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
const mockCreateToken = createToken as jest.MockedFunction<typeof createToken>;

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe autenticar exitosamente un usuario con credenciales válidas y devolver token JWT en cookie httpOnly', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const mockUser = {
      _id: 'user123',
      email: 'usuario@test.com',
      name: 'Usuario Test',
      role: 'user',
      password: '$2a$10$hashedpassword123',
    };

    mockUserFindOne.mockResolvedValue(mockUser as any);
    (mockBcryptCompare as any).mockResolvedValue(true);
    mockCreateToken.mockResolvedValue('jwt-token-abc123');

    const req = {
      json: async () => ({
        email: 'usuario@test.com',
        password: 'password123',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockDbConnect).toHaveBeenCalled();
    expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'usuario@test.com' });
    expect(mockBcryptCompare).toHaveBeenCalledWith('password123', '$2a$10$hashedpassword123');
    expect(mockCreateToken).toHaveBeenCalledWith({
      id: 'user123',
      email: 'usuario@test.com',
      role: 'user',
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('Login successful');
    expect(body.user).toBeDefined();
    expect(body.user.id).toBe('user123');
    expect(body.user.email).toBe('usuario@test.com');
    expect(body.user.name).toBe('Usuario Test');
    expect(body.user.role).toBe('user');
    expect(body.user.password).toBeUndefined(); // No debe incluir la contraseña

    // Verificar que se estableció la cookie
    expect(res.cookies.get('token')).toBeDefined();
    const cookie = res.cookies.get('token');
    expect(cookie?.value).toBe('jwt-token-abc123');
  });

  test('debe retornar error 400 cuando no se proporciona el campo email', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const req = {
      json: async () => ({
        // email missing
        password: 'password123',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockUserFindOne).not.toHaveBeenCalled();
    expect(mockBcryptCompare).not.toHaveBeenCalled();
    expect(mockCreateToken).not.toHaveBeenCalled();

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email and password are required');
  });

  test('debe retornar error 400 cuando no se proporciona el campo password', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const req = {
      json: async () => ({
        email: 'usuario@test.com',
        // password missing
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockUserFindOne).not.toHaveBeenCalled();
    expect(mockBcryptCompare).not.toHaveBeenCalled();
    expect(mockCreateToken).not.toHaveBeenCalled();

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email and password are required');
  });

  test('debe retornar error 401 con mensaje genérico cuando el usuario no existe sin revelar información sobre la existencia de la cuenta', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindOne.mockResolvedValue(null); // Usuario no existe

    const req = {
      json: async () => ({
        email: 'noexiste@test.com',
        password: 'password123',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockDbConnect).toHaveBeenCalled();
    expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'noexiste@test.com' });
    expect(mockBcryptCompare).not.toHaveBeenCalled(); // No debe verificar password
    expect(mockCreateToken).not.toHaveBeenCalled();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid credentials'); // Mensaje genérico
    expect(body.error).not.toContain('user'); // No debe mencionar que el usuario no existe
    expect(body.error).not.toContain('exist');
  });

  test('debe retornar error 401 con mensaje genérico cuando la contraseña es incorrecta sin diferenciar del caso de usuario inexistente', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const mockUser = {
      _id: 'user123',
      email: 'usuario@test.com',
      name: 'Usuario Test',
      role: 'user',
      password: '$2a$10$hashedpassword123',
    };

    mockUserFindOne.mockResolvedValue(mockUser as any);
    (mockBcryptCompare as any).mockResolvedValue(false); // Contraseña incorrecta

    const req = {
      json: async () => ({
        email: 'usuario@test.com',
        password: 'wrongpassword',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockDbConnect).toHaveBeenCalled();
    expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'usuario@test.com' });
    expect(mockBcryptCompare).toHaveBeenCalledWith('wrongpassword', '$2a$10$hashedpassword123');
    expect(mockCreateToken).not.toHaveBeenCalled();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid credentials'); // Mismo mensaje genérico
    expect(body.error).not.toContain('password');
    expect(body.error).not.toContain('incorrect');
  });

  test('debe establecer correctamente las propiedades de seguridad de la cookie del token JWT incluyendo httpOnly y sameSite', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const mockUser = {
      _id: 'user456',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'admin',
      password: '$2a$10$hashedpassword456',
    };

    mockUserFindOne.mockResolvedValue(mockUser as any);
    (mockBcryptCompare as any).mockResolvedValue(true);
    mockCreateToken.mockResolvedValue('admin-jwt-token');

    const req = {
      json: async () => ({
        email: 'admin@test.com',
        password: 'adminpass123',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(200);
    
    // Verificar propiedades de la cookie
    const cookie = res.cookies.get('token');
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe('admin-jwt-token');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('lax');
    expect(cookie?.maxAge).toBe(60 * 60 * 24 * 7); // 7 días
  });

  test('debe autenticar correctamente un usuario con rol admin y devolver el rol en la respuesta', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const mockAdminUser = {
      _id: 'admin789',
      email: 'superadmin@test.com',
      name: 'Super Admin',
      role: 'admin',
      password: '$2a$10$hashedadminpass',
    };

    mockUserFindOne.mockResolvedValue(mockAdminUser as any);
    (mockBcryptCompare as any).mockResolvedValue(true);
    mockCreateToken.mockResolvedValue('admin-token-xyz');

    const req = {
      json: async () => ({
        email: 'superadmin@test.com',
        password: 'adminpassword',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.role).toBe('admin');
    expect(mockCreateToken).toHaveBeenCalledWith({
      id: 'admin789',
      email: 'superadmin@test.com',
      role: 'admin',
    });
  });

  test('debe retornar error 500 sin exponer detalles técnicos cuando ocurre un error interno en la base de datos', async () => {
    // Arrange
    mockDbConnect.mockRejectedValue(new Error('Database connection timeout'));

    const req = {
      json: async () => ({
        email: 'usuario@test.com',
        password: 'password123',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
    expect(body.error).not.toContain('Database');
    expect(body.error).not.toContain('timeout');
    expect(body.error).not.toContain('stack');
  });

  test('debe manejar correctamente emails con diferentes formatos de capitalización realizando búsqueda case-sensitive', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const mockUser = {
      _id: 'user999',
      email: 'Usuario@Test.com', // Email con mayúsculas en DB
      name: 'Usuario Mixto',
      role: 'user',
      password: '$2a$10$hashedpassword999',
    };

    mockUserFindOne.mockResolvedValue(mockUser as any);
    (mockBcryptCompare as any).mockResolvedValue(true);
    mockCreateToken.mockResolvedValue('token-mixed-case');

    const req = {
      json: async () => ({
        email: 'Usuario@Test.com', // Debe coincidir exactamente
        password: 'password123',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'Usuario@Test.com' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe('Usuario@Test.com');
  });

  test('debe no incluir la contraseña hasheada en la respuesta JSON para prevenir exposición de información sensible', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const mockUser = {
      _id: 'user111',
      email: 'secure@test.com',
      name: 'Secure User',
      role: 'user',
      password: '$2a$10$verysecurehash',
      secretData: 'sensitive-info', // Datos adicionales sensibles
    };

    mockUserFindOne.mockResolvedValue(mockUser as any);
    (mockBcryptCompare as any).mockResolvedValue(true);
    mockCreateToken.mockResolvedValue('secure-token');

    const req = {
      json: async () => ({
        email: 'secure@test.com',
        password: 'correctpassword',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.password).toBeUndefined();
    expect(body.user.secretData).toBeUndefined();
    // Solo debe incluir campos específicos
    expect(Object.keys(body.user)).toEqual(['id', 'email', 'name', 'role']);
  });
});
