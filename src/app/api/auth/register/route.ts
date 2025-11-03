import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { createToken } from '@/lib/auth';
import { sendEmail, getWelcomeEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'user',
    });

    // Send welcome email (no await to not block the response)
    sendEmail({
      to: user.email,
      subject: 'Welcome to Eanel.pro! 🎉',
      html: getWelcomeEmailTemplate(user.name, user.email),
    }).catch(err => console.error('Failed to send welcome email:', err));

    // Create token
    const token = await createToken({
      id: String(user._id),
      email: user.email,
      role: user.role,
    });

    // Create response with cookie
    const response = NextResponse.json({
      message: 'User created successfully',
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    
    // Proporcionar error más específico para problemas de conexión
    if (error && typeof error === 'object' && ('name' in error && error.name === 'MongooseServerSelectionError' || 'code' in error && error.code === 'ENOTFOUND')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please check your MongoDB configuration.' },
        { status: 503 }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
