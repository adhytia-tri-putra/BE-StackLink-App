import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const transport = getTransport();
  if (!transport) return false;

  await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Reset your StackLink password",
    text: `Use this link to reset your StackLink password. The link expires in 30 minutes: ${resetUrl}`,
    html: `<p>Use the link below to reset your StackLink password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes.</p>`,
  });

  return true;
}

export async function sendEmailVerification(email: string, verificationUrl: string): Promise<boolean> {
  const transport = getTransport();
  if (!transport) return false;
  await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Verify your StackLink email",
    text: `Verify your StackLink email within 24 hours: ${verificationUrl}`,
    html: `<p>Welcome to StackLink.</p><p><a href="${verificationUrl}">Verify your email</a></p><p>This link expires in 24 hours.</p>`,
  });
  return true;
}
