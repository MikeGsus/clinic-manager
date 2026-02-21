# Sistema de Gestión de Clínica - México

## Contexto del Proyecto
- Clínica médica en México
- 1-5 profesionales de salud simultáneos
- <100 pacientes/mes
- Sin sistemas previos (greenfield project)

## Stack Tecnológico
- Backend: Node.js + Express + Prisma + PostgreSQL
- Frontend: React + TypeScript + shadcn/ui + Tailwind CSS
- Auth: JWT + 2FA
- Files: Multer (local storage)
- DB: PostgreSQL con Prisma ORM

## UI/UX Guidelines
- Usar shadcn/ui para componentes base
- Tailwind CSS para estilos personalizados
- Tema médico: colores azul/verde suaves
- Responsive-first (mobile compatible)
- Accesibilidad: contraste WCAG 2.1 AA

## Integraciones Críticas (Preparar para futuro)
- SAT México (facturación CFDI)
- WhatsApp Business API
- Bancos mexicanos (SPEI, tarjetas)

## Estructura de Roles
1. admin - Acceso total
2. doctor - Agenda propia, historiales completos
3. enfermera - Apoyo en consultas, historiales limitados  
4. recepcionista - Citas, datos básicos pacientes
5. paciente - Portal limitado (citas, datos personales)

## Estándares de Código
- TypeScript estricto
- Validación con Joi/Yup
- Tests con Jest
- ESLint + Prettier
- Commits convencionales
- Documentación JSDoc

## Comandos de Desarrollo
- `npm run dev` - Desarrollo full stack
- `npm run test` - Tests completos
- `npm run build` - Build producción
- `npx prisma migrate dev` - Migraciones BD
- `npm run seed` - Datos de prueba

## Consideraciones México
- Zona horaria: America/Mexico_City
- Moneda: MXN (pesos mexicanos)
- Validación CURP/RFC
- Formatos teléfono mexicanos
- Cumplimiento NOM-004-SSA3