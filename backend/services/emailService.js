const nodemailer = require('nodemailer');

let cachedTransporter = null;
let cachedMode = null;

const isProduction = process.env.NODE_ENV === 'production';

const createSmtpTransporter = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const getTransporter = async () => {
  if (cachedTransporter) {
    return { transporter: cachedTransporter, mode: cachedMode };
  }

  const smtpTransporter = createSmtpTransporter();
  if (smtpTransporter) {
    cachedTransporter = smtpTransporter;
    cachedMode = 'smtp';
    return { transporter: cachedTransporter, mode: cachedMode };
  }

  if (isProduction) {
    throw new Error('SMTP configuration is missing in production');
  }

  // Development fallback that does not require real mailbox credentials.
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  cachedMode = 'ethereal';

  return { transporter: cachedTransporter, mode: cachedMode };
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const { transporter, mode } = await getTransporter();

  const from =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    'Campus Resource Booking <no-reply@campusbook.local>';

  const subject = 'Password Reset Request';
  const text = `Hi ${name || 'User'},\n\nYou requested a password reset. Use the link below to set a new password:\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\nThis link expires in 10 minutes.\n`;

  const html = `
    <p>Hi ${name || 'User'},</p>
    <p>You requested a password reset for your Campus Resource Booking account.</p>
    <p>
      <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">
        Reset your password
      </a>
    </p>
    <p>If you did not request this, you can safely ignore this email.</p>
    <p><strong>This link expires in 10 minutes.</strong></p>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  return {
    mode,
    messageId: info.messageId,
    accepted: info.accepted || [],
    rejected: info.rejected || [],
    previewUrl: mode === 'ethereal' ? nodemailer.getTestMessageUrl(info) : null,
  };
};

module.exports = {
  sendPasswordResetEmail,
};
