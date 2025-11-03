// Servicio de correo electrónico usando SMTP con Nodemailer
// IMPORTANTE: Instala nodemailer primero: npm install nodemailer @types/nodemailer

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const smtpUser = process.env.SMTP_USER || 'soporteeanelpro@gmail.com';
  const smtpPass = process.env.SMTP_PASS || 'xpuq yavd llbi aozi';

  try {
    // Intentar importar nodemailer dinámicamente
    let nodemailer;
    try {
      // Usar import dinámico con Function para evitar errores de TypeScript y ESLint
      const importNodemailer = new Function('return import("nodemailer")');
      nodemailer = await importNodemailer().catch(() => null);
    } catch {
      nodemailer = null;
    }
    
    if (!nodemailer) {
      // Si nodemailer no está instalado, solo log en consola
      console.log('📧 Email (nodemailer not installed):');
      console.log('From:', smtpUser);
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('---');
      console.log('⚠️  To enable real email sending, run: npm install nodemailer @types/nodemailer');
      return { success: true };
    }

    // Crear transportador SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Enviar correo
    const info = await transporter.sendMail({
      from: `"Eanel.pro" <${smtpUser}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error };
  }
}

// Templates de correo

export function getWelcomeEmailTemplate(name: string, email: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a Eanel.pro! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hola ${name},</h2>
            <p>Gracias por registrarte en Eanel.pro. Tu cuenta ha sido creada exitosamente.</p>
            <p><strong>Email:</strong> ${email}</p>
            <p>Ahora puedes iniciar sesión y comenzar a solicitar tus licencias.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">Iniciar Sesión</a>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Eanel.pro. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getPasswordResetEmailTemplate(name: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperar Contraseña</h1>
          </div>
          <div class="content">
            <h2>Hola ${name},</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Eanel.pro.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            <div class="warning">
              <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por seguridad.
            </div>
            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Eanel.pro. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getLicenseApprovedEmailTemplate(
  name: string,
  licenseKey: string,
  expiryDate: string,
  accountIds: string[]
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .license-key { background: #1f2937; color: #10b981; padding: 20px; font-family: monospace; font-size: 16px; border-radius: 5px; margin: 20px 0; text-align: center; letter-spacing: 2px; }
          .info-box { background: white; border: 1px solid #e5e7eb; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ ¡Licencia Aprobada!</h1>
          </div>
          <div class="content">
            <h2>Hola ${name},</h2>
            <p>¡Excelentes noticias! Tu solicitud de licencia ha sido aprobada y tu pago verificado.</p>
            
            <h3>Tu Clave de Licencia:</h3>
            <div class="license-key">${licenseKey}</div>
            
            <div class="info-box">
              <p><strong>📅 Fecha de Expiración:</strong> ${expiryDate}</p>
              <p><strong>🔢 Cuentas MT5 Autorizadas:</strong></p>
              <ul>
                ${accountIds.map(id => `<li>${id}</li>`).join('')}
              </ul>
            </div>
            
            <p>Puedes copiar tu clave de licencia y usarla inmediatamente en tu plataforma MT5.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/home" class="button">Ver Mis Licencias</a>
            
            <p>Si tienes alguna pregunta o problema, no dudes en contactar con soporte.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Eanel.pro. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getPaymentVerifiedEmailTemplate(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #1f2937; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Pago Verificado</h1>
          </div>
          <div class="content">
            <h2>Hola ${name},</h2>
            <p>Te confirmamos que tu pago ha sido verificado exitosamente por nuestro equipo.</p>
            <p>Tu licencia será creada y enviada en breve. Recibirás otro correo con los detalles de tu licencia.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/home/my-requests" class="button">Ver Mis Solicitudes</a>
            <p>Gracias por tu paciencia.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Eanel.pro. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getPaymentRejectedEmailTemplate(name: string, reason: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .reason-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Pago No Verificado</h1>
          </div>
          <div class="content">
            <h2>Hola ${name},</h2>
            <p>Lamentamos informarte que tu comprobante de pago no pudo ser verificado.</p>
            
            <div class="reason-box">
              <strong>Motivo:</strong> ${reason}
            </div>
            
            <p>Por favor, revisa la información y vuelve a enviar tu comprobante de pago con los datos correctos.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/home/request-license" class="button">Enviar Nuevo Comprobante</a>
            
            <p>Si tienes dudas, contacta con soporte para recibir asistencia.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Eanel.pro. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
