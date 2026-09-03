const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./sockets');
const { port, env } = require('./config/env');

const server = http.createServer(app);

// Attach Socket.io to the same HTTP server so REST API and websockets share one port
initSocket(server);

const startServer = async () => {
  await connectDB();

  server.listen(port, () => {
    console.log(`[server] TripWise API running in ${env} mode on port ${port}`);
  });
};

startServer();

// ---------- Graceful shutdown & crash safety ----------

const shutdown = async (signal) => {
  console.log(`\n[server] ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectDB();
    console.log('[server] Shutdown complete');
    process.exit(0);
  });

  // Force-exit if shutdown hangs
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (err) => {
  console.error(`[server] Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error(`[server] Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = server;
