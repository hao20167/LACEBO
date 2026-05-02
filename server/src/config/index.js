const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'lacebo-secret-key-change-in-production',
  jwtExpiresIn: '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dbPath: process.env.DB_PATH || null, // null = default (../data/lacebo.db)
};

export default config;
