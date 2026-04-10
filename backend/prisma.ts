import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __exshopiPrisma: PrismaClient | undefined;
}

const safeParseConnectionTarget = (value?: string | null) => {
  if (!value) {
    return {
      host: 'missing',
      port: '',
      protocol: '',
      username: '',
      pathname: '',
      valid: false,
    };
  }

  try {
    const parsed = new URL(value);
    return {
      host: parsed.hostname || 'unknown',
      port: parsed.port || '',
      protocol: parsed.protocol.replace(/:$/, ''),
      username: parsed.username || '',
      pathname: parsed.pathname || '',
      valid: true,
    };
  } catch {
    return {
      host: 'invalid',
      port: '',
      protocol: '',
      username: '',
      pathname: '',
      valid: false,
    };
  }
};

const getConnectionIssues = (
  label: 'DATABASE_URL' | 'DIRECT_URL',
  value?: string | null
) => {
  const parsed = safeParseConnectionTarget(value);
  const issues: string[] = [];

  if (!value) {
    issues.push(`${label} is missing`);
    return issues;
  }

  if (!parsed.valid) {
    issues.push(`${label} is not a valid URL`);
    return issues;
  }

  if (parsed.protocol !== 'postgresql') {
    issues.push(`${label} must start with postgresql://`);
  }

  if (parsed.pathname !== '/postgres') {
    issues.push(`${label} path should be /postgres`);
  }

  if (/\s/.test(String(value))) {
    issues.push(`${label} contains whitespace`);
  }

  if (label === 'DATABASE_URL') {
    if (parsed.port !== '6543') {
      issues.push('DATABASE_URL must use pooler port 6543');
    }
    if (!parsed.host.includes('pooler.supabase.com')) {
      issues.push('DATABASE_URL must use the Supabase pooler host');
    }
    if (!parsed.username.startsWith('postgres.')) {
      issues.push('DATABASE_URL username should look like postgres.<project-ref>');
    }
  }

  if (label === 'DIRECT_URL') {
    if (parsed.port !== '5432') {
      issues.push('DIRECT_URL must use direct port 5432');
    }
    if (!parsed.host.startsWith('db.') || !parsed.host.includes('.supabase.co')) {
      issues.push('DIRECT_URL must use the direct db.<project-ref>.supabase.co host');
    }
    if (parsed.username !== 'postgres') {
      issues.push('DIRECT_URL username should be postgres');
    }
  }

  return issues;
};

export const getPrismaEnvDiagnostics = () => {
  const databaseUrl = safeParseConnectionTarget(process.env.DATABASE_URL);
  const directUrl = safeParseConnectionTarget(process.env.DIRECT_URL);
  const usePrismaRuntime =
    process.env.USE_PRISMA_RUNTIME === 'true' ||
    process.env.EXSHOPI_DB_MODE === 'prisma';

  return {
    usePrismaRuntime: String(process.env.USE_PRISMA_RUNTIME || ''),
    exshopiDbMode: String(process.env.EXSHOPI_DB_MODE || ''),
    connectionMode: usePrismaRuntime ? 'prisma' : 'legacy-json',
    databaseUrlHost: databaseUrl.port ? `${databaseUrl.host}:${databaseUrl.port}` : databaseUrl.host,
    directUrlHost: directUrl.port ? `${directUrl.host}:${directUrl.port}` : directUrl.host,
    databaseUrlProtocol: databaseUrl.protocol || 'unknown',
    directUrlProtocol: directUrl.protocol || 'unknown',
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasDirectUrl: Boolean(process.env.DIRECT_URL),
    databaseUrlIssues: getConnectionIssues('DATABASE_URL', process.env.DATABASE_URL),
    directUrlIssues: getConnectionIssues('DIRECT_URL', process.env.DIRECT_URL),
  };
};

export const prisma =
  global.__exshopiPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

export const probePrismaConnection = async () => {
  const diagnostics = getPrismaEnvDiagnostics();
  const configIssues = [
    ...diagnostics.databaseUrlIssues,
    ...diagnostics.directUrlIssues,
  ];

  if (configIssues.length) {
    return {
      ok: false,
      message: configIssues.join(' | '),
      code: 'CONFIG_INVALID',
      name: 'PrismaConfigError',
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      message: 'Prisma database connection probe succeeded.',
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error?.message || 'Unknown Prisma connection failure',
      code: error?.code || 'unknown',
      name: error?.name || 'Error',
    };
  }
};

if (process.env.NODE_ENV !== 'production') {
  global.__exshopiPrisma = prisma;
}
