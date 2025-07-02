export default () => ({
  port: process.env.PORT,
  postgres: {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    domain: process.env.SESSION_DOMAIN,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
  uploadPath: process.env.UPLOAD_PATH,
  nodeEnv: process.env.NODE_ENV,
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
  email: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    bucket: process.env.SUPABASE_BUCKET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
});
