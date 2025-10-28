import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().optional(),
    KEYCLOAK_URL: z.string().url().optional(),
    KEYCLOAK_REALM: z.string().optional(),
    KEYCLOAK_CLIENT_ID: z.string().optional(),
    KEYCLOAK_CLIENT_SECRET: z.string().optional()
});
export function validateEnvironment(config) {
    const result = envSchema.safeParse(config);
    if (!result.success) {
        const formatted = result.error.format();
        throw new Error(`Invalid environment variables: ${JSON.stringify(formatted, null, 2)}`);
    }
    return result.data;
}
//# sourceMappingURL=env.validation.js.map