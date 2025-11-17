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
jest.mock('@/lib/email');

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { sendEmail, getWelcomeEmailTemplate } from '@/lib/email';
import { POST } from '@/app/api/auth/register/route';

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockUserFindOne = User.findOne as jest.MockedFunction<typeof User.findOne>;
const mockUserCreate = User.create as jest.MockedFunction<typeof User.create>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockCreateToken = createToken as jest.MockedFunction<typeof createToken>;
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
const mockGetWelcomeEmailTemplate = getWelcomeEmailTemplate as jest.MockedFunction<typeof getWelcomeEmailTemplate>;

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe registrar exitosamente un nuevo usuario con todos los campos válidos, hashear la contraseña y devolver token JWT en cookie httpOnly', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindOne.mockResolvedValue(null); // Usuario no existe

    const mockCreatedUser = {
      _id: 'newuser123',
      email: 'nuevo@test.com',
      name: 'Usuario Nuevo',
      role: 'user',
      password: '$2a$10$hashedpassword',
    };

    (mockBcryptHash as any).mockResolvedValue('$2a$10$hashedpassword');
    mockUserCreate.mockResolvedValue(mockCreatedUser as any);
    mockCreateToken.mockResolvedValue('new-user-jwt-token');
    mockGetWelcomeEmailTemplate.mockReturnValue('<h1>Welcome</h1>');
    mockSendEmail.mockResolvedValue(undefined as any);

    const req = {
      json: async () => ({
        email: 'nuevo@test.com',
        password: 'password123',
        name: 'Usuario Nuevo',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockDbConnect).toHaveBeenCalled();
    expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'nuevo@test.com' });
    expect(mockBcryptHash).toHaveBeenCalledWith('password123', 10);
    expect(mockUserCreate).toHaveBeenCalledWith({
      email: 'nuevo@test.com',
      password: '$2a$10$hashedpassword',
      name: 'Usuario Nuevo',
      role: 'user',
    });
    expect(mockCreateToken).toHaveBeenCalledWith({
      id: 'newuser123',
      email: 'nuevo@test.com',
      role: 'user',
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('User created successfully');
    expect(body.user).toBeDefined();
    expect(body.user.id).toBe('newuser123');
    expect(body.user.email).toBe('nuevo@test.com');
    expect(body.user.name).toBe('Usuario Nuevo');
    expect(body.user.role).toBe('user');
    expect(body.user.password).toBeUndefined(); // No debe incluir la contraseña

    // Verificar que se estableció la cookie
    const cookie = res.cookies.get('token');
    expect(cookie?.value).toBe('new-user-jwt-token');
    expect(cookie?.httpOnly).toBe(true);
  });

  test('debe retornar error 400 cuando falta el campo obligatorio email', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const req = {
      json: async () => ({
        // email missing
        password: 'password123',
        name: 'Usuario Test',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockUserFindOne).not.toHaveBeenCalled();
    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockBcryptHash).not.toHaveBeenCalled();
    expect(mockCreateToken).not.toHaveBeenCalled();

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email, password, and name are required');
  });

  test('debe retornar error 400 cuando falta el campo obligatorio password', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const req = {
      json: async () => ({
        email: 'usuario@test.com',
        // password missing
        name: 'Usuario Test',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockUserFindOne).not.toHaveBeenCalled();
    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockBcryptHash).not.toHaveBeenCalled();

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email, password, and name are required');
  });

  test('debe retornar error 400 cuando falta el campo obligatorio name', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const req = {
      json: async () => ({
        email: 'usuario@test.com',
        password: 'password123',
        // name missing
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockUserFindOne).not.toHaveBeenCalled();
    expect(mockUserCreate).not.toHaveBeenCalled();

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email, password, and name are required');
  });

  test('debe retornar error 400 cuando el email ya está registrado en el sistema', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);

    const existingUser = {
      _id: 'existing123',
      email: 'existente@test.com',
      name: 'Usuario Existente',
      role: 'user',
    };

    mockUserFindOne.mockResolvedValue(existingUser as any); // Usuario ya existe

    const req = {
      json: async () => ({
        email: 'existente@test.com',
        password: 'password123',
        name: 'Nuevo Intento',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'existente@test.com' });
    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockBcryptHash).not.toHaveBeenCalled();
    expect(mockCreateToken).not.toHaveBeenCalled();

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('User already exists');
  });

  test('debe hashear la contraseña con bcrypt usando factor de trabajo 10 antes de almacenarla en la base de datos', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindOne.mockResolvedValue(null);

    const mockCreatedUser = {
      _id: 'secure123',
      email: 'secure@test.com',
      name: 'Secure User',
      role: 'user',
      password: '$2a$10$securehashedpassword',
    };

    (mockBcryptHash as any).mockResolvedValue('$2a$10$securehashedpassword');
    mockUserCreate.mockResolvedValue(mockCreatedUser as any);
    mockCreateToken.mockResolvedValue('secure-token');
    mockGetWelcomeEmailTemplate.mockReturnValue('<h1>Welcome</h1>');
    mockSendEmail.mockResolvedValue(undefined as any);

    const req = {
      json: async () => ({
        email: 'secure@test.com',
        password: 'mySecurePassword123!',
        name: 'Secure User',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockBcryptHash).toHaveBeenCalledWith('mySecurePassword123!', 10);
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        password: '$2a$10$securehashedpassword',
      })
    );
    expect(res.status).toBe(200);
  });

  test('debe asignar automáticamente el rol user por defecto al nuevo usuario registrado', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindOne.mockResolvedValue(null);

    const mockCreatedUser = {
      _id: 'defaultrole123',
      email: 'normal@test.com',
      name: 'Normal User',
      role: 'user', // Rol por defecto
      password: '$2a$10$hash',
    };

    (mockBcryptHash as any).mockResolvedValue('$2a$10$hash');
    mockUserCreate.mockResolvedValue(mockCreatedUser as any);
    mockCreateToken.mockResolvedValue('token');
    mockGetWelcomeEmailTemplate.mockReturnValue('<h1>Welcome</h1>');
    mockSendEmail.mockResolvedValue(undefined as any);

    const req = {
      json: async () => ({
        email: 'normal@test.com',
        password: 'password123',
        name: 'Normal User',
        // No se especifica role
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'user',
      })
    );
    const body = await res.json();
    expect(body.user.role).toBe('user');
  });

  test('debe enviar email de bienvenida al usuario después de registro exitoso sin bloquear la respuesta', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindOne.mockResolvedValue(null);

    const mockCreatedUser = {
      _id: 'emailuser123',
      email: 'welcome@test.com',
      name: 'Welcome User',
      role: 'user',
      password: '$2a$10$hash',
    };

    (mockBcryptHash as any).mockResolvedValue('$2a$10$hash');
    mockUserCreate.mockResolvedValue(mockCreatedUser as any);
    mockCreateToken.mockResolvedValue('token');
    mockGetWelcomeEmailTemplate.mockReturnValue('<h1>Welcome Welcome User</h1>');
    mockSendEmail.mockResolvedValue(undefined as any);

    const req = {
      json: async () => ({
        email: 'welcome@test.com',
        password: 'password123',
        name: 'Welcome User',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(mockGetWelcomeEmailTemplate).toHaveBeenCalledWith('Welcome User', 'welcome@test.com');
    expect(mockSendEmail).toHaveBeenCalledWith({
      to: 'welcome@test.com',
      subject: 'Welcome to Eanel.pro! 🎉',
      html: '<h1>Welcome Welcome User</h1>',
    });
    expect(res.status).toBe(200); // Respuesta debe ser exitosa incluso si email está pendiente
  });

  test('debe completar el registro exitosamente incluso si el envío del email de bienvenida falla', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindOne.mockResolvedValue(null);

    const mockCreatedUser = {
      _id: 'noemailuser123',
      email: 'noemail@test.com',
      name: 'No Email User',
      role: 'user',
      password: '$2a$10$hash',
    };

    (mockBcryptHash as any).mockResolvedValue('$2a$10$hash');
    mockUserCreate.mockResolvedValue(mockCreatedUser as any);
    mockCreateToken.mockResolvedValue('token-noemail');
    mockGetWelcomeEmailTemplate.mockReturnValue('<h1>Welcome</h1>');
    mockSendEmail.mockRejectedValue(new Error('SMTP connection failed')); // Email falla

    const req = {
      json: async () => ({
        email: 'noemail@test.com',
        password: 'password123',
        name: 'No Email User',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(200); // Registro exitoso aunque email falló
    const body = await res.json();
    expect(body.message).toBe('User created successfully');
    expect(body.user.id).toBe('noemailuser123');
  });

  test('debe retornar error 503 cuando falla la conexión a la base de datos MongoDB', async () => {
    // Arrange
    const dbError = new Error('Connection timeout');
    (dbError as any).name = 'MongooseServerSelectionError';
    mockDbConnect.mockRejectedValue(dbError);

    const req = {
      json: async () => ({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('Database connection failed. Please check your MongoDB configuration.');
  });

  test('debe retornar error 500 sin exponer detalles técnicos cuando ocurre un error genérico no relacionado con la base de datos', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindOne.mockRejectedValue(new Error('Unexpected internal error'));

    const req = {
      json: async () => ({
        email: 'error@test.com',
        password: 'password123',
        name: 'Error User',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error).not.toContain('stack');
    expect(body.error).not.toContain('Unexpected');
  });

  test('debe establecer correctamente las propiedades de la cookie del token incluyendo maxAge de 7 días', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindOne.mockResolvedValue(null);

    const mockCreatedUser = {
      _id: 'cookieuser123',
      email: 'cookie@test.com',
      name: 'Cookie User',
      role: 'user',
      password: '$2a$10$hash',
    };

    (mockBcryptHash as any).mockResolvedValue('$2a$10$hash');
    mockUserCreate.mockResolvedValue(mockCreatedUser as any);
    mockCreateToken.mockResolvedValue('cookie-token-123');
    mockGetWelcomeEmailTemplate.mockReturnValue('<h1>Welcome</h1>');
    mockSendEmail.mockResolvedValue(undefined as any);

    const req = {
      json: async () => ({
        email: 'cookie@test.com',
        password: 'password123',
        name: 'Cookie User',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    const cookie = res.cookies.get('token');
    expect(cookie?.value).toBe('cookie-token-123');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('lax');
    expect(cookie?.maxAge).toBe(60 * 60 * 24 * 7); // 7 días en segundos
  });

  test('debe no incluir la contraseña en la respuesta JSON para prevenir exposición de información sensible', async () => {
    // Arrange
    mockDbConnect.mockResolvedValue({} as any);
    mockUserFindOne.mockResolvedValue(null);

    const mockCreatedUser = {
      _id: 'secureresponse123',
      email: 'secureresponse@test.com',
      name: 'Secure Response',
      role: 'user',
      password: '$2a$10$shouldnotbeincluded',
      internalField: 'internal-data', // Campo interno que no debe exponerse
    };

    (mockBcryptHash as any).mockResolvedValue('$2a$10$shouldnotbeincluded');
    mockUserCreate.mockResolvedValue(mockCreatedUser as any);
    mockCreateToken.mockResolvedValue('token');
    mockGetWelcomeEmailTemplate.mockReturnValue('<h1>Welcome</h1>');
    mockSendEmail.mockResolvedValue(undefined as any);

    const req = {
      json: async () => ({
        email: 'secureresponse@test.com',
        password: 'password123',
        name: 'Secure Response',
      }),
    } as any;

    // Act
    const res = await POST(req);

    // Assert
    const body = await res.json();
    expect(body.user.password).toBeUndefined();
    expect(body.user.internalField).toBeUndefined();
    // Solo debe incluir campos específicos
    expect(Object.keys(body.user)).toEqual(['id', 'email', 'name', 'role']);
  });
});
