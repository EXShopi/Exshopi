import { createSign } from 'node:crypto';

type GoogleAnalyticsDateRangeKey = 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'custom';

export type GoogleAnalyticsDateRangeInput = {
  range?: GoogleAnalyticsDateRangeKey;
  from?: Date;
  to?: Date;
};

type GoogleAnalyticsDimension = { name: string };
type GoogleAnalyticsMetric = { name: string };
type GoogleAnalyticsRequestBody = {
  dimensions?: GoogleAnalyticsDimension[];
  metrics: GoogleAnalyticsMetric[];
  dateRanges?: Array<{ startDate: string; endDate: string }>;
  dimensionFilter?: Record<string, unknown>;
  metricAggregations?: string[];
  orderBys?: Array<Record<string, unknown>>;
  limit?: string;
  offset?: string;
  keepEmptyRows?: boolean;
  returnPropertyQuota?: boolean;
};

type GoogleAnalyticsApiResponse = {
  rowCount?: number;
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
  totals?: Array<{
    metricValues?: Array<{ value?: string }>;
  }>;
  propertyQuota?: Record<string, unknown>;
};

type GoogleAnalyticsConfig = {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
  enabled: boolean;
  missing: string[];
};

type GoogleAnalyticsCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ANALYTICS_DATA_BASE_URL = 'https://analyticsdata.googleapis.com/v1beta';
const GOOGLE_ANALYTICS_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const DEV_ANALYTICS_DEBUG = process.env.DEBUG_ADMIN_ANALYTICS === '1' || process.env.NODE_ENV !== 'production';

const requestCache = new Map<string, GoogleAnalyticsCacheEntry<any>>();
let accessTokenCache: GoogleAnalyticsCacheEntry<string> | null = null;

function logDebug(message: string, payload?: unknown) {
  if (!DEV_ANALYTICS_DEBUG) return;
  if (payload === undefined) {
    console.info(`[ga-admin] ${message}`);
    return;
  }
  console.info(`[ga-admin] ${message}`, payload);
}

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function safeJsonParse<T>(value: string | undefined | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readGoogleAnalyticsConfig(): GoogleAnalyticsConfig {
  const rawJson =
    process.env.GA_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON ||
    '';
  const parsedJson = safeJsonParse<Record<string, string>>(rawJson);

  const propertyId = String(
    process.env.GA4_PROPERTY_ID ||
      process.env.GA_PROPERTY_ID ||
      process.env.GOOGLE_ANALYTICS_PROPERTY_ID ||
      ''
  ).trim();
  const clientEmail = String(
    process.env.GA_SERVICE_ACCOUNT_EMAIL ||
      process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT_EMAIL ||
      parsedJson?.client_email ||
      ''
  ).trim();
  const privateKey = String(
    process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY ||
      process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT_PRIVATE_KEY ||
      parsedJson?.private_key ||
      ''
  )
    .replace(/\\n/g, '\n')
    .trim();

  const missing = [
    !propertyId ? 'GA4 property id' : '',
    !clientEmail ? 'service account email' : '',
    !privateKey ? 'service account private key' : '',
  ].filter(Boolean);

  return {
    propertyId,
    clientEmail,
    privateKey,
    enabled: missing.length === 0,
    missing,
  };
}

function getCacheEntry<T>(key: string): T | null {
  const cached = requestCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    requestCache.delete(key);
    return null;
  }
  return cached.value as T;
}

function setCacheEntry<T>(key: string, value: T, ttlMs: number) {
  requestCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function createJwtAssertion(config: GoogleAnalyticsConfig) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: config.clientEmail,
    sub: config.clientEmail,
    scope: GOOGLE_ANALYTICS_SCOPE,
    aud: OAUTH_TOKEN_URL,
    iat: issuedAt,
    exp: expiresAt,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(config.privateKey);

  return `${signingInput}.${toBase64Url(signature)}`;
}

async function getAccessToken(config: GoogleAnalyticsConfig) {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60_000) {
    return accessTokenCache.value;
  }

  const assertion = createJwtAssertion(config);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || typeof payload?.access_token !== 'string') {
    throw new Error(
      `Failed to authorize Google Analytics service account (${response.status}): ${payload?.error_description || payload?.error || 'Unknown error'}`
    );
  }

  const expiresInSeconds = Number(payload.expires_in || 3600);
  accessTokenCache = {
    value: payload.access_token,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };

  return payload.access_token as string;
}

async function executeAnalyticsRequest(
  config: GoogleAnalyticsConfig,
  method: 'runReport' | 'runRealtimeReport',
  body: GoogleAnalyticsRequestBody,
  ttlMs: number
) {
  const cacheKey = JSON.stringify({
    method,
    propertyId: config.propertyId,
    body,
  });
  const cached = getCacheEntry<GoogleAnalyticsApiResponse>(cacheKey);
  if (cached) return cached;

  const accessToken = await getAccessToken(config);
  const response = await fetch(
    `${ANALYTICS_DATA_BASE_URL}/properties/${config.propertyId}:${method}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const payload = (await response.json().catch(() => ({}))) as GoogleAnalyticsApiResponse & {
    error?: { message?: string; details?: Array<{ message?: string }> };
  };

  if (!response.ok) {
    const detail =
      payload?.error?.message ||
      payload?.error?.details?.map((entry) => entry?.message).filter(Boolean).join('; ') ||
      `Google Analytics request failed with ${response.status}`;
    throw new Error(detail);
  }

  setCacheEntry(cacheKey, payload, ttlMs);
  return payload;
}

function toDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildDateRanges(input?: GoogleAnalyticsDateRangeInput) {
  const today = new Date();
  const range = input?.range || '30d';

  if (range === 'custom' && input?.from && input?.to) {
    return [
      {
        startDate: toDateString(input.from),
        endDate: toDateString(input.to),
      },
    ];
  }

  if (range === 'today') {
    return [{ startDate: 'today', endDate: 'today' }];
  }

  if (range === 'yesterday') {
    return [{ startDate: 'yesterday', endDate: 'yesterday' }];
  }

  if (range === '7d') {
    return [{ startDate: '7daysAgo', endDate: 'today' }];
  }

  if (range === 'this_month') {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return [{ startDate: toDateString(monthStart), endDate: 'today' }];
  }

  return [{ startDate: '30daysAgo', endDate: 'today' }];
}

function parseMetricValue(value: string | undefined) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function mapReportRows(
  response: GoogleAnalyticsApiResponse,
  dimensionKeys: string[],
  metricKeys: string[]
) {
  return (response.rows || []).map((row) => {
    const dimensions = Object.fromEntries(
      dimensionKeys.map((key, index) => [key, String(row.dimensionValues?.[index]?.value || '')])
    );
    const metrics = Object.fromEntries(
      metricKeys.map((key, index) => [key, parseMetricValue(row.metricValues?.[index]?.value)])
    );
    return {
      ...dimensions,
      ...metrics,
    };
  });
}

async function tryReportCandidates(
  config: GoogleAnalyticsConfig,
  candidates: Array<{ key: string; body: GoogleAnalyticsRequestBody }>,
  ttlMs = 120_000
) {
  const errors: string[] = [];

  for (const candidate of candidates) {
    try {
      const response = await executeAnalyticsRequest(config, 'runReport', candidate.body, ttlMs);
      return {
        key: candidate.key,
        response,
        errors,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${candidate.key}: ${message}`);
    }
  }

  throw new Error(errors.join(' | ') || 'All Google Analytics report candidates failed');
}

function buildTopList<T extends Record<string, any>>(
  rows: T[],
  valueKey: keyof T,
  limit = 8
) {
  return rows
    .slice()
    .sort((left, right) => Number(right[valueKey] || 0) - Number(left[valueKey] || 0))
    .slice(0, limit);
}

function normalizeCountry(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRegion(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function inferProductPage(pathname: string) {
  const path = String(pathname || '').trim();
  if (!path || path === '/') return false;
  if (path.startsWith('/admin') || path.startsWith('/seller') || path.startsWith('/account')) {
    return false;
  }
  const segments = path.split('?')[0].split('/').filter(Boolean);
  return segments.length >= 3;
}

function inferCategoryPage(pathname: string) {
  const path = String(pathname || '').trim();
  if (!path || path === '/') return false;
  const segments = path.split('?')[0].split('/').filter(Boolean);
  if (segments[0] === 'category') return segments.length >= 2;
  return segments.length === 2;
}

async function getGoogleAnalyticsReports(config: GoogleAnalyticsConfig, dateRange: GoogleAnalyticsDateRangeInput) {
  const dateRanges = buildDateRanges(dateRange);

  const summary = await executeAnalyticsRequest(
    config,
    'runReport',
    {
      dateRanges,
      metrics: [
        { name: 'activeUsers' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'engagedSessions' },
        { name: 'averageSessionDuration' },
        { name: 'eventCount' },
        { name: 'keyEvents' },
      ],
      returnPropertyQuota: true,
    },
    120_000
  );

  const summaryTotals = summary.totals?.[0]?.metricValues || [];
  const trend = await executeAnalyticsRequest(
    config,
    'runReport',
    {
      dateRanges,
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'eventCount' },
        { name: 'keyEvents' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: '120',
    },
    120_000
  );

  const geographyCountry = await executeAnalyticsRequest(
    config,
    'runReport',
    {
      dateRanges,
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: '20',
    },
    180_000
  );

  const geographyCity = await executeAnalyticsRequest(
    config,
    'runReport',
    {
      dateRanges,
      dimensions: [{ name: 'country' }, { name: 'city' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: '30',
    },
    180_000
  );

  const geographyRegion = await executeAnalyticsRequest(
    config,
    'runReport',
    {
      dateRanges,
      dimensions: [{ name: 'country' }, { name: 'region' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: '30',
    },
    180_000
  );

  const deviceCategory = await executeAnalyticsRequest(
    config,
    'runReport',
    {
      dateRanges,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: '10',
    },
    180_000
  );

  const browser = await executeAnalyticsRequest(
    config,
    'runReport',
    {
      dateRanges,
      dimensions: [{ name: 'browser' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: '12',
    },
    180_000
  );

  const operatingSystem = await executeAnalyticsRequest(
    config,
    'runReport',
    {
      dateRanges,
      dimensions: [{ name: 'operatingSystem' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: '12',
    },
    180_000
  );

  const acquisition = await tryReportCandidates(config, [
    {
      key: 'sessionSourceMedium',
      body: {
        dateRanges,
        dimensions: [{ name: 'sessionSourceMedium' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'keyEvents' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: '12',
      },
    },
    {
      key: 'firstUserSourceMedium',
      body: {
        dateRanges,
        dimensions: [{ name: 'firstUserSourceMedium' }],
        metrics: [{ name: 'totalUsers' }, { name: 'newUsers' }],
        orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
        limit: '12',
      },
    },
  ]);

  const channels = await tryReportCandidates(config, [
    {
      key: 'sessionDefaultChannelGroup',
      body: {
        dateRanges,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'keyEvents' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: '12',
      },
    },
  ]);

  const referrals = await tryReportCandidates(config, [
    {
      key: 'fullReferrer',
      body: {
        dateRanges,
        dimensions: [{ name: 'fullReferrer' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: '12',
      },
    },
  ]);

  const pageContent = await tryReportCandidates(config, [
    {
      key: 'unifiedPagePathScreen',
      body: {
        dateRanges,
        dimensions: [{ name: 'unifiedPagePathScreen' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'averageSessionDuration' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: '40',
      },
    },
    {
      key: 'pagePathPlusQueryString',
      body: {
        dateRanges,
        dimensions: [{ name: 'pagePathPlusQueryString' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'averageSessionDuration' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: '40',
      },
    },
  ]);

  const landingPages = await tryReportCandidates(config, [
    {
      key: 'landingPagePlusQueryString',
      body: {
        dateRanges,
        dimensions: [{ name: 'landingPagePlusQueryString' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'keyEvents' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: '20',
      },
    },
  ]);

  let demographics: {
    available: boolean;
    reason?: string;
    ageBrackets: Array<Record<string, any>>;
    genders: Array<Record<string, any>>;
    interests: Array<Record<string, any>>;
  } = {
    available: false,
    ageBrackets: [],
    genders: [],
    interests: [],
    reason: 'Not enough real Google Analytics demographics data is available yet.',
  };

  try {
    const [age, gender, interests] = await Promise.all([
      tryReportCandidates(config, [
        {
          key: 'userAgeBracket',
          body: {
            dateRanges,
            dimensions: [{ name: 'userAgeBracket' }],
            metrics: [{ name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            limit: '10',
          },
        },
      ]),
      tryReportCandidates(config, [
        {
          key: 'userGender',
          body: {
            dateRanges,
            dimensions: [{ name: 'userGender' }],
            metrics: [{ name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            limit: '10',
          },
        },
      ]),
      tryReportCandidates(config, [
        {
          key: 'brandingInterest',
          body: {
            dateRanges,
            dimensions: [{ name: 'brandingInterest' }],
            metrics: [{ name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            limit: '10',
          },
        },
      ]),
    ]);

    const ageRows = mapReportRows(age.response, ['userAgeBracket'], ['activeUsers']);
    const genderRows = mapReportRows(gender.response, ['userGender'], ['activeUsers']);
    const interestRows = mapReportRows(interests.response, ['brandingInterest'], ['activeUsers']);

    demographics = {
      available: ageRows.length > 0 || genderRows.length > 0 || interestRows.length > 0,
      ageBrackets: ageRows,
      genders: genderRows,
      interests: interestRows,
      reason:
        ageRows.length || genderRows.length || interestRows.length
          ? undefined
          : 'Not enough real Google Analytics demographics data is available yet.',
    };
  } catch (error) {
    demographics = {
      available: false,
      ageBrackets: [],
      genders: [],
      interests: [],
      reason: error instanceof Error ? error.message : 'Demographics are unavailable from the property.',
    };
  }

  const realtimeSummary = await executeAnalyticsRequest(
    config,
    'runRealtimeReport',
    {
      metrics: [{ name: 'activeUsers' }, { name: 'eventCount' }],
      returnPropertyQuota: true,
    },
    45_000
  );

  const realtimeCountries = await executeAnalyticsRequest(
    config,
    'runRealtimeReport',
    {
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: '10',
    },
    45_000
  );

  const realtimeCities = await executeAnalyticsRequest(
    config,
    'runRealtimeReport',
    {
      dimensions: [{ name: 'country' }, { name: 'city' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: '12',
    },
    45_000
  );

  const realtimeRegions = await executeAnalyticsRequest(
    config,
    'runRealtimeReport',
    {
      dimensions: [{ name: 'country' }, { name: 'region' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: '12',
    },
    45_000
  );

  const countryRows = mapReportRows(geographyCountry, ['country'], ['activeUsers', 'sessions']);
  const cityRows = mapReportRows(geographyCity, ['country', 'city'], ['activeUsers', 'sessions']);
  const regionRows = mapReportRows(geographyRegion, ['country', 'region'], ['activeUsers', 'sessions']);
  const pageRows = mapReportRows(
    pageContent.response,
    [pageContent.key],
    ['screenPageViews', 'activeUsers', 'averageSessionDuration']
  ).map((row) => ({
    path: String(row[pageContent.key] || ''),
    screenPageViews: Number(row.screenPageViews || 0),
    activeUsers: Number(row.activeUsers || 0),
    averageSessionDuration: Number(row.averageSessionDuration || 0),
  }));

  const landingRows = mapReportRows(
    landingPages.response,
    [landingPages.key],
    ['sessions', 'activeUsers', 'keyEvents']
  ).map((row) => ({
    landingPage: String(row[landingPages.key] || ''),
    sessions: Number(row.sessions || 0),
    activeUsers: Number(row.activeUsers || 0),
    keyEvents: Number(row.keyEvents || 0),
  }));

  const uaeCities = cityRows.filter((row) => normalizeCountry(row.country) === 'united arab emirates');
  const uaeRegions = regionRows.filter((row) => normalizeCountry(row.country) === 'united arab emirates');
  const dubaiUsers =
    uaeCities
      .filter((row) => normalizeRegion(row.city).includes('dubai'))
      .reduce((sum, row) => sum + Number(row.activeUsers || 0), 0) ||
    uaeRegions
      .filter((row) => normalizeRegion(row.region).includes('dubai'))
      .reduce((sum, row) => sum + Number(row.activeUsers || 0), 0);

  const topProductPages = buildTopList(
    pageRows.filter((row) => inferProductPage(row.path)),
    'screenPageViews',
    10
  );
  const topCategoryPages = buildTopList(
    pageRows.filter((row) => inferCategoryPage(row.path)),
    'screenPageViews',
    10
  );

  return {
    summary: {
      activeUsers: parseMetricValue(summaryTotals[0]?.value),
      totalUsers: parseMetricValue(summaryTotals[1]?.value),
      newUsers: parseMetricValue(summaryTotals[2]?.value),
      sessions: parseMetricValue(summaryTotals[3]?.value),
      engagedSessions: parseMetricValue(summaryTotals[4]?.value),
      averageEngagementTime: parseMetricValue(summaryTotals[5]?.value),
      eventCount: parseMetricValue(summaryTotals[6]?.value),
      keyEvents: parseMetricValue(summaryTotals[7]?.value),
    },
    trend: mapReportRows(trend, ['date'], ['activeUsers', 'sessions', 'eventCount', 'keyEvents']),
    geography: {
      countries: countryRows,
      cities: cityRows,
      regions: regionRows,
      uaeBreakdown: {
        cities: buildTopList(uaeCities, 'activeUsers', 10),
        regions: buildTopList(uaeRegions, 'activeUsers', 10),
        dubaiUsers,
      },
    },
    devices: {
      categories: mapReportRows(deviceCategory, ['deviceCategory'], ['activeUsers', 'sessions']),
      operatingSystems: mapReportRows(operatingSystem, ['operatingSystem'], ['activeUsers']),
      browsers: mapReportRows(browser, ['browser'], ['activeUsers']),
    },
    acquisition: {
      sourceMedium: mapReportRows(
        acquisition.response,
        [acquisition.key],
        acquisition.key === 'sessionSourceMedium'
          ? ['sessions', 'activeUsers', 'keyEvents']
          : ['totalUsers', 'newUsers']
      ),
      channels: mapReportRows(channels.response, [channels.key], ['sessions', 'activeUsers', 'keyEvents']),
      referrals: mapReportRows(referrals.response, [referrals.key], ['sessions', 'activeUsers']),
      fallbackNotes: [
        ...acquisition.errors,
        ...channels.errors,
        ...referrals.errors,
      ],
    },
    content: {
      topPages: buildTopList(pageRows, 'screenPageViews', 12),
      topProductPages,
      topCategoryPages,
      topLandingPages: buildTopList(landingRows, 'sessions', 12),
      pathDimension: pageContent.key,
      landingDimension: landingPages.key,
      inferenceNote:
        'Top product and category pages are inferred from real GA paths using ExShopi route structure; no synthetic labels are added.',
    },
    demographics,
    realtime: {
      activeUsersNow: parseMetricValue(realtimeSummary.totals?.[0]?.metricValues?.[0]?.value),
      eventCount: parseMetricValue(realtimeSummary.totals?.[0]?.metricValues?.[1]?.value),
      activeUsersLast30Minutes: parseMetricValue(realtimeSummary.totals?.[0]?.metricValues?.[0]?.value),
      countries: mapReportRows(realtimeCountries, ['country'], ['activeUsers']),
      cities: mapReportRows(realtimeCities, ['country', 'city'], ['activeUsers']),
      regions: mapReportRows(realtimeRegions, ['country', 'region'], ['activeUsers']),
      note: 'Google Analytics realtime reports represent active users in the last 30 minutes.',
    },
    propertyQuota: summary.propertyQuota || null,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getGoogleAnalyticsAdminSnapshot(dateRange: GoogleAnalyticsDateRangeInput) {
  const config = readGoogleAnalyticsConfig();

  if (!config.enabled) {
    return {
      connected: false,
      source: 'google-analytics-data-api',
      propertyId: config.propertyId || null,
      configurationIssue: `Google Analytics is not configured yet: missing ${config.missing.join(', ')}`,
      summary: null,
      trend: [],
      geography: {
        countries: [],
        cities: [],
        regions: [],
        uaeBreakdown: {
          cities: [],
          regions: [],
          dubaiUsers: 0,
        },
      },
      devices: {
        categories: [],
        operatingSystems: [],
        browsers: [],
      },
      acquisition: {
        sourceMedium: [],
        channels: [],
        referrals: [],
        fallbackNotes: [],
      },
      content: {
        topPages: [],
        topProductPages: [],
        topCategoryPages: [],
        topLandingPages: [],
        pathDimension: null,
        landingDimension: null,
        inferenceNote:
          'Google Analytics is not configured yet, so no traffic data is available from the property.',
      },
      demographics: {
        available: false,
        ageBrackets: [],
        genders: [],
        interests: [],
        reason: 'Google Analytics is not configured yet.',
      },
      realtime: {
        activeUsersNow: 0,
        eventCount: 0,
        activeUsersLast30Minutes: 0,
        countries: [],
        cities: [],
        regions: [],
        note: 'Google Analytics is not configured yet.',
      },
      propertyQuota: null,
      fetchedAt: new Date().toISOString(),
    };
  }

  try {
    logDebug('Fetching Google Analytics admin snapshot', {
      propertyId: config.propertyId,
      range: dateRange.range || '30d',
    });

    const reports = await getGoogleAnalyticsReports(config, dateRange);

    return {
      connected: true,
      source: 'google-analytics-data-api',
      propertyId: config.propertyId,
      configurationIssue: null,
      ...reports,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google Analytics error';
    logDebug('Google Analytics snapshot failed', { message });

    return {
      connected: false,
      source: 'google-analytics-data-api',
      propertyId: config.propertyId || null,
      configurationIssue: message,
      summary: null,
      trend: [],
      geography: {
        countries: [],
        cities: [],
        regions: [],
        uaeBreakdown: {
          cities: [],
          regions: [],
          dubaiUsers: 0,
        },
      },
      devices: {
        categories: [],
        operatingSystems: [],
        browsers: [],
      },
      acquisition: {
        sourceMedium: [],
        channels: [],
        referrals: [],
        fallbackNotes: [],
      },
      content: {
        topPages: [],
        topProductPages: [],
        topCategoryPages: [],
        topLandingPages: [],
        pathDimension: null,
        landingDimension: null,
        inferenceNote:
          'Google Analytics could not be reached for this request, so only internal store metrics will be available.',
      },
      demographics: {
        available: false,
        ageBrackets: [],
        genders: [],
        interests: [],
        reason: message,
      },
      realtime: {
        activeUsersNow: 0,
        eventCount: 0,
        activeUsersLast30Minutes: 0,
        countries: [],
        cities: [],
        regions: [],
        note: message,
      },
      propertyQuota: null,
      fetchedAt: new Date().toISOString(),
    };
  }
}
