import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Server Configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-care-management',
    database: process.env.MONGODB_DATABASE || 'dental-care-management',
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'dental-care-super-secret-jwt-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'dental-care-management-system',
    audience: 'dental-care-users',
  },
  
  // Refresh Token Configuration
  refreshToken: {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    maxUsage: parseInt(process.env.REFRESH_TOKEN_MAX_USAGE || '100', 10),
    maxTokensPerUser: parseInt(process.env.MAX_REFRESH_TOKENS_PER_USER || '5', 10),
  },
  
  // CORS Configuration
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  
  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    helmetEnabled: process.env.HELMET_ENABLED === 'true',
  },
  
  // Token Security Configuration
  tokenSecurity: {
    rotationEnabled: process.env.TOKEN_ROTATION_ENABLED === 'true',
    cleanupInterval: process.env.TOKEN_CLEANUP_INTERVAL || '24h',
    cleanupBatchSize: parseInt(process.env.TOKEN_CLEANUP_BATCH_SIZE || '1000', 10),
  },
  
  // Audit Logging Configuration
  auditLogging: {
    level: process.env.AUDIT_LOG_LEVEL || 'INFO',
    retentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90', 10),
    cleanupInterval: process.env.AUDIT_LOG_CLEANUP_INTERVAL || '24h',
    maxSize: process.env.AUDIT_LOG_MAX_SIZE || '100MB',
  },
  
  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'dental-care-session-secret-2024',
    cookieMaxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE || '604800000', 10), // 7 days
  },
  
  // Cloudinary Configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  // File Upload Configuration
  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
  },
  
  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || 'noreply@dentalcare.com',
    },
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    fileEnabled: process.env.LOG_FILE_ENABLED === 'true',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  },
  
  // Health Check Configuration
  healthCheck: {
    enabled: process.env.HEALTH_CHECK_ENABLED === 'true',
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
  },
  
  // Monitoring Configuration
  monitoring: {
    enabled: process.env.METRICS_ENABLED === 'true',
    port: parseInt(process.env.METRICS_PORT || '9090', 10),
  },
  
  // Cache Configuration
  cache: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
  },
  
  // Backup Configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    interval: process.env.BACKUP_INTERVAL || '24h',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  },
}));
