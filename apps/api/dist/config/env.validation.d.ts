import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    DATABASE_URL: z.ZodString;
    REDIS_URL: z.ZodOptional<z.ZodString>;
    KEYCLOAK_URL: z.ZodOptional<z.ZodString>;
    KEYCLOAK_REALM: z.ZodOptional<z.ZodString>;
    KEYCLOAK_CLIENT_ID: z.ZodOptional<z.ZodString>;
    KEYCLOAK_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    DATABASE_URL: string;
    REDIS_URL?: string | undefined;
    KEYCLOAK_URL?: string | undefined;
    KEYCLOAK_REALM?: string | undefined;
    KEYCLOAK_CLIENT_ID?: string | undefined;
    KEYCLOAK_CLIENT_SECRET?: string | undefined;
}, {
    DATABASE_URL: string;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    PORT?: number | undefined;
    REDIS_URL?: string | undefined;
    KEYCLOAK_URL?: string | undefined;
    KEYCLOAK_REALM?: string | undefined;
    KEYCLOAK_CLIENT_ID?: string | undefined;
    KEYCLOAK_CLIENT_SECRET?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare function validateEnvironment(config: Record<string, unknown>): Env;
export {};
