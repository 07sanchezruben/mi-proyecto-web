import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { sendEmail, buildEmailVerificationLink } from '../utils/email.js';

const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, env.jwtSecret, {
    expiresIn: '7d'
  });
}

async function createUserWithRole(data, role) {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  return prisma.user.create({
    data: {
      username: data.username,
      passwordHash,
      email: data.email,
      role,
      [role]: { create: data.profile }
    },
    include: { [role]: true }
  });
}

async function registerDriver(data) {
  const user = await createUserWithRole(data, 'driver');
  await createEmailVerification(user);
  return user;
}

async function registerCompany(data) {
  const user = await createUserWithRole(data, 'company');
  await createEmailVerification(user);
  return user;
}

async function registerWorkshop(data) {
  const user = await createUserWithRole(data, 'workshop');
  await createEmailVerification(user);
  return user;
}

async function login({ username, password }) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error('Invalid credentials');
  if (!user.active) throw new Error('Account disabled');
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new Error('Invalid credentials');
  const token = generateToken(user);
  return { token, user };
}

async function createEmailVerification(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt
    }
  });
  await sendEmail({
    to: user.email,
    subject: 'Verifica tu cuenta de PubliCar',
    html: `<p>Hola ${user.username},</p><p>Confirma tu email haciendo clic en <a href="${buildEmailVerificationLink(token)}">este enlace</a>.</p>`
  });
}

async function verifyEmail(token) {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record) throw new Error('Token inválido');
  if (record.expiresAt < new Date()) throw new Error('Token caducado');
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.emailVerificationToken.delete({ where: { token } })
  ]);
}

export const authService = {
  registerDriver,
  registerCompany,
  registerWorkshop,
  login,
  verifyEmail,
  createEmailVerification,
  generateToken
};
