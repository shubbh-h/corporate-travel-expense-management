const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

const { env, apiPrefix, cookieSecret } = require('./config/env');
const corsOptions = require('./config/cors');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust the first proxy hop (needed on Render/Vercel/behind load balancers)
// so req.ip and secure cookies behave correctly.
app.set('trust proxy', 1);

// ---------- Security middleware ----------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary-hosted files to render
  })
);
app.use(cors(corsOptions));
app.use(mongoSanitize()); // strip $ and . operators from user input (NoSQL injection protection)
app.use(xss()); // sanitize user input against basic XSS payloads
app.use(hpp()); // protect against HTTP parameter pollution

// ---------- Body & cookie parsing ----------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(cookieSecret));

// ---------- Logging ----------
if (env !== 'test') {
  app.use(morgan(env === 'development' ? 'dev' : 'combined'));
}

// ---------- Rate limiting (applied to all API routes) ----------
app.use(apiPrefix, apiLimiter);

// ---------- Static files (local fallback; primary storage is Cloudinary) ----------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- Health check ----------
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TripWise API is running',
    environment: env,
    timestamp: new Date().toISOString(),
  });
});

// ---------- API routes ----------
app.use(`${apiPrefix}/auth`, require('./routes/authRoutes'));
app.use(`${apiPrefix}/trips`, require('./routes/tripRoutes'));
app.use(`${apiPrefix}/expenses`, require('./routes/expenseRoutes'));
app.use(`${apiPrefix}/notifications`, require('./routes/notificationRoutes'));
app.use(`${apiPrefix}/approvals`, require('./routes/approvalRoutes'));
app.use(`${apiPrefix}/admin`, require('./routes/adminRoutes'));
app.use(`${apiPrefix}/uploads`, require('./routes/uploadRoutes'));

// Remaining route modules are mounted here as they are built out, e.g.:
// app.use(`${apiPrefix}/users`, require('./routes/userRoutes'));
// app.use(`${apiPrefix}/departments`, require('./routes/departmentRoutes'));
// app.use(`${apiPrefix}/analytics`, require('./routes/analyticsRoutes'));

app.get(apiPrefix, (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome to the TripWise API', version: 'v1' });
});

// ---------- 404 + error handling (must stay last) ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
