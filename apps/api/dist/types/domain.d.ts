import type { Prisma } from '@prisma/client';
export type TransactionClient = Prisma.TransactionClient;
export declare function isValidInvitationCode(code: string): boolean;
export declare function isValidResortId(value: unknown): value is number;
export declare function isNonEmptyString(value: unknown): value is string;
