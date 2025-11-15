import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPassword
  }
});

export async function sendEmail({ to, subject, html }) {
  if (!env.smtpHost || env.smtpHost.includes('example.com')) {
    console.warn('SMTP credentials are not configured. Email would have been sent to', to);
    return;
  }
  await transporter.sendMail({ from: `PubliCar <${env.smtpUser}>`, to, subject, html });
}

export function buildEmailVerificationLink(token) {
  return `${env.appUrl}/api/v1/auth/verify-email?token=${token}`;
}
