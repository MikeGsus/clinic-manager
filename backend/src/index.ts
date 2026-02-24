import 'dotenv/config'; // Load .env before anything else
import './config/env.js'; // Validate env vars (fail-fast)
import { prisma } from './lib/prisma.js';
import app from './app.js';
import { env } from './config/env.js';
import { processDueReminders } from './services/reminder.service.js';

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  });

  // Process due appointment reminders every hour
  setInterval(() => { processDueReminders(); }, 60 * 60 * 1000);

  async function shutdown(signal: string) {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
