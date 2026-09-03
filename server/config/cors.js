const { clientUrls } = require('./env');

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser tools (curl, Postman) which send no origin header
    if (!origin || clientUrls.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'], // needed for file download / export responses
  maxAge: 86400,
};

module.exports = corsOptions;
