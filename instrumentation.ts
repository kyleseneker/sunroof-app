/**
 * Next.js Instrumentation
 * 
 * This file runs once when the Next.js server starts.
 * Use it for server-side initialization and validation.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv, logEnvStatus } = await import('./src/lib/env');
    
    // Validate environment variables
    const { valid, errors } = validateEnv();
    
    if (!valid) {
      console.error('\n❌ Environment validation failed:');
      errors.forEach(e => {
        console.error(`   - ${e.variable}: ${e.message}`);
      });
      console.error('\nPlease check your .env.local file.\n');
      
      // In production, fail hard
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Missing required environment variables');
      }
    } else {
      // Log configuration status
      logEnvStatus();
    }
  }
}

