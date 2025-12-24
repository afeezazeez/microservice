import dotenv from 'dotenv';

dotenv.config();

class ConfigService {
  get(key: string, defaultValue?: string): string {
    return process.env[key] ?? defaultValue ?? '';
  }

  getNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    return value ? Number(value) : (defaultValue ?? 0);
  }

  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue ?? false;
    return value.toLowerCase() === 'true';
  }

  get port(): number {
    return this.getNumber('PORT', 3001);
  }

  get nodeEnv(): string {
    return this.get('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get database() {
    return {
      host: this.get('DB_HOST', 'mysql'),
      port: this.getNumber('DB_PORT', 3306),
      name: this.get('DB_NAME', 'project_db'),
      user: this.get('DB_USER', 'root'),
      password: this.get('DB_PASSWORD', 'rootpassword'),
    };
  }

  get jwtSecret(): string {
    const secret = this.get('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is required but not set in environment variables');
    }
    return secret;
  }

  get redis() {
    return {
      host: this.get('REDIS_HOST', 'redis'),
      port: this.getNumber('REDIS_PORT', 6379),
    };
  }

  get logLevel(): string {
    return this.get('LOG_LEVEL', 'info');
  }
}

export default new ConfigService();


