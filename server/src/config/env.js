import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/publicar',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',
  smtpHost: process.env.SMTP_HOST || 'smtp.example.com',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || 'publicar@example.com',
  smtpPassword: process.env.SMTP_PASSWORD || 'change-me',
  appUrl: process.env.APP_URL || 'http://localhost:4000'
};
