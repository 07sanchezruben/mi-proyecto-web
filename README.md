# PubliCar – Plataforma full stack

Este repositorio contiene un MVP completo de PubliCar, conectando conductores particulares, empresas anunciantes, talleres de vinilado y un panel administrador con métricas y eventos.

## Arquitectura y stack

- **Frontend**: SPA vanilla (HTML/CSS/JS) en `client/` con navegación, dashboards dinámicos y conexión WebSocket.
- **Backend**: Node.js + Express en `server/` organizado por capas (routes, controllers, services, middlewares, utils).
- **Base de datos**: PostgreSQL gestionado con Prisma ORM (`server/prisma/schema.prisma`).
- **Tiempo real**: Socket.IO para notificaciones, chat y actualizaciones en vivo.
- **Pagos**: Stripe PaymentIntents (modo test) con cálculo automático de comisión del 20%.
- **Emails**: Nodemailer + SMTP configurable para verificación de correo y notificaciones.

## Puesta en marcha

1. **Backend**

   ```bash
   cd server
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed # datos demo: driver_demo / company_demo / workshop_demo / admin (clave publicar123)
   npm run dev
   ```

   Variables de entorno necesarias (`server/.env`):

   ```env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/publicar"
   JWT_SECRET="cambia-esto"
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   SMTP_HOST="smtp.tu-proveedor.com"
   SMTP_PORT=587
   SMTP_USER="publicar@tu-dominio.com"
   SMTP_PASSWORD="clave"
   APP_URL="http://localhost:4000"
   CORS_ORIGIN="http://localhost:5173"
   ```

   > Nota: el endpoint `/api/v1/payments/webhook` requiere recibir el cuerpo en bruto (`express.raw`). Configura tu CLI de Stripe para reenviar eventos en modo test.

2. **Frontend**

   Sirve `client/index.html` con tu servidor estático favorito o un simple `npx serve client`. El frontend asume que la API corre en el mismo origen (`http://localhost:4000`).

## Funcionalidades clave

- Registro/login con JWT por roles (driver, company, workshop, admin) y verificación de email real.
- Panel conductor: perfil editable con validación de DNI, propuestas con matchScore, agenda de vinilado con slots rojos/verdes, recordatorios de que no paga el vinilado.
- Panel empresa: matching inteligente, estimaciones económicas (80% conductor / 20% plataforma), subida de diseños, creación de propuestas y arranque de pagos Stripe.
- Panel taller: gestión de disponibilidad y reservas confirmadas en tiempo real.
- Panel admin: métricas económicas, listado de pagos, eventos y gestión de usuarios.
- Chat y notificaciones en vivo para propuestas, reservas y pagos.

## WebSockets y notificaciones

El cliente se conecta a Socket.IO tras el login. Eventos clave:

- `proposal:update`: refresca estados tras aceptación, rechazo o reserva de slot.
- `message:new`: avisos de nuevos mensajes entre empresa y conductor.
- `workshop:slot`: actualiza disponibilidad en talleres.

## Pagos y economía

- Base mensual por tamaño de vinilo (pequeño 80 €, medio 120 €, completo 180 €).
- Ajuste por km realizados vs mínimos de la campaña.
- Comisión del 20% para PubliCar; el conductor solo ve su ingreso neto (`estEarning`).

## Emails

`auth.service.js` envía correos de verificación con enlaces a `/api/v1/auth/verify-email`. Configura SMTP real para producción.

## Semillas

`npm run seed` crea datos iniciales para probar todo el flujo:

- Conductores, empresas, talleres y admin de demo.
- Diseño de vinilo y slots de taller (rojos/verdes).
- Propuesta pendiente para probar el flujo completo.

¡Listo! Con esta base puedes desplegar PubliCar en producción, conectar Stripe y tu proveedor SMTP real, y escalar la plataforma.
