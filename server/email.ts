import nodemailer from 'nodemailer';

interface SendVerificationCodeOptions {
  toEmail: string;
  userName: string;
  code: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

// Default credentials provided by user
const DEFAULT_SMTP_HOST = 'smtp.gmail.com';
const DEFAULT_SMTP_PORT = 587;
const DEFAULT_SMTP_USER = 'negrolobo592@gmail.com';
const DEFAULT_SMTP_PASS = 'jqhypcpginmorgzi';
const DEFAULT_SMTP_FROM = '"Sistema de Calzado" <negrolobo592@gmail.com>';

let cachedTransporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // Check SMTP / Email credentials from env or fallback to provided Gmail credentials
  const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : DEFAULT_SMTP_PORT;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || DEFAULT_SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || DEFAULT_SMTP_PASS;

  if (host && user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    return cachedTransporter;
  }

  if (user && pass && !host) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
    return cachedTransporter;
  }

  // Automatic Ethereal account creation for real nodemailer delivery testing if no credentials set
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('[EMAIL SYSTEM] Creada cuenta de prueba Ethereal:', testAccount.user);
    return cachedTransporter;
  } catch (err) {
    console.warn('[EMAIL SYSTEM] No se pudo crear cuenta Ethereal, utilizando jsonTransport:', err);
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return cachedTransporter;
  }
}

export async function sendVerificationEmail({ toEmail, userName, code }: SendVerificationCodeOptions): Promise<EmailResult> {
  try {
    const transporter = await getTransporter();

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || DEFAULT_SMTP_FROM;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #f9fafb; border-radius: 16px; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 6px 0; font-weight: 700;">Sistema de Calzado</h2>
          <p style="color: #6b7280; font-size: 13px; margin: 0;">Verificación de correo electrónico</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6; text-align: center;">
          <p style="color: #374151; font-size: 14px; margin-top: 0;">Hola <strong>${userName}</strong>,</p>
          <p style="color: #4b5563; font-size: 13px; line-height: 1.5;">Para confirmar y verificar tu cuenta de correo electrónico en el sistema, utiliza el siguiente código de 6 dígitos:</p>
          
          <div style="margin: 24px 0; padding: 16px; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; display: inline-block;">
            <span style="font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #92400e;">${code}</span>
          </div>

          <p style="color: #9ca3af; font-size: 11px; margin-bottom: 0;">Si no solicitaste este código, puedes ignorar este mensaje.</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 11px;">
          &copy; ${new Date().getFullYear()} Sistema de Calzado - Todos los derechos reservados.
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Código de Verificación: ${code} - Sistema de Calzado`,
      text: `Hola ${userName}, tu código de verificación de 6 dígitos para el Sistema de Calzado es: ${code}`,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    if (previewUrl) {
      console.log(`[EMAIL SYSTEM] Vista previa del correo enviado (Ethereal): ${previewUrl}`);
    } else {
      console.log(`[EMAIL SYSTEM] Correo enviado exitosamente a ${toEmail} (ID: ${info.messageId})`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  } catch (error: any) {
    console.error('[EMAIL SYSTEM ERROR] Error al enviar el correo:', error);
    return {
      success: false,
      error: error.message || 'Error al enviar el correo.'
    };
  }
}
