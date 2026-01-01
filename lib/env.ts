/**
 * Environment variable validation
 */

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  OPENAI_API_KEY?: string;
  NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

interface ValidationError {
  variable: string;
  message: string;
}

export function validateEnv(): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ] as const;

  for (const varName of required) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      errors.push({
        variable: varName,
        message: `${varName} is required but not set`,
      });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      new URL(supabaseUrl);
    } catch {
      errors.push({
        variable: 'NEXT_PUBLIC_SUPABASE_URL',
        message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL',
      });
    }
  }

  const hasRedisUrl = !!process.env.UPSTASH_REDIS_REST_URL;
  const hasRedisToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;
  if (hasRedisUrl !== hasRedisToken) {
    errors.push({
      variable: 'UPSTASH_REDIS_*',
      message: 'Both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set together',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getEnv(): EnvConfig {
  const { valid, errors } = validateEnv();
  
  if (!valid) {
    const errorMessages = errors.map(e => `  - ${e.variable}: ${e.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

export const features = {
  get aiEnabled(): boolean {
    return !!process.env.OPENAI_API_KEY;
  },
  
  get pushEnabled(): boolean {
    return !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  },
  
  get redisEnabled(): boolean {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  },
};

export function logEnvStatus(): void {
  console.log('[Env] Configuration status:');
  console.log(`  - Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗'}`);
  console.log(`  - AI (OpenAI): ${features.aiEnabled ? '✓' : '○ (optional)'}`);
  console.log(`  - Push Notifications: ${features.pushEnabled ? '✓' : '○ (optional)'}`);
  console.log(`  - Redis Rate Limiting: ${features.redisEnabled ? '✓' : '○ (using in-memory)'}`);
}
