import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: requireEnv('DATABASE_URL'),
  dbPoolMin: Number(process.env.DB_POOL_MIN ?? 0),
  dbPoolMax: Number(process.env.DB_POOL_MAX ?? 10),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: requireEnv('JWT_EXPIRES_IN'),
  uploadPath: process.env.UPLOAD_PATH ?? 'uploads/',
} as const;
