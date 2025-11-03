import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';
import { sendEmail, getPasswordResetEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    // Por seguridad, siempre devolvemos éxito aunque el usuario no exista
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists, a password reset link has been sent',
      });
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Guardar token en la base de datos (expira en 1 hora)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
    await user.save();

    // Crear URL de recuperación
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Enviar correo
    await sendEmail({
      to: user.email,
      subject: 'Recuperar Contraseña - Eanel.pro',
      html: getPasswordResetEmailTemplate(user.name, resetUrl),
    });

    return NextResponse.json({
      message: 'If an account exists, a password reset link has been sent',
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
