import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'backend', 'uploads');

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const DOCUMENT_MIME_TYPES = new Set(['application/pdf', ...IMAGE_MIME_TYPES]);

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

const parseDataUrl = (dataUrl: string) => {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid data URL payload');
  }
  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], 'base64'),
  };
};

const safeSegment = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^-+|-+$/g, '') || 'uploads';

const safeFileName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file';

const cloudinaryEnabled = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

async function uploadToCloudinary(dataUrl: string, folder: string, publicId: string, resourceType: 'image' | 'raw') {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);
  const signatureBase = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureBase).digest('hex');

  const body = new URLSearchParams();
  body.set('file', dataUrl);
  body.set('folder', folder);
  body.set('public_id', publicId);
  body.set('timestamp', String(timestamp));
  body.set('api_key', apiKey);
  body.set('signature', signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: 'POST',
      body,
    }
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || 'Cloud upload failed');
  }
  return {
    url: json.secure_url as string,
    provider: 'cloudinary' as const,
  };
}

async function uploadLocally(dataUrl: string, folder: string, fileName: string, mimeType: string) {
  const { buffer } = parseDataUrl(dataUrl);
  const ext = EXT_BY_MIME[mimeType] || 'bin';
  const folderPath = path.join(UPLOAD_DIR, folder);
  await fs.mkdir(folderPath, { recursive: true });
  const diskName = `${fileName}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const absolutePath = path.join(folderPath, diskName);
  await fs.writeFile(absolutePath, buffer);
  return {
    url: `/uploads/${folder}/${diskName}`,
    provider: 'local' as const,
  };
}

export async function uploadDataUrl(input: {
  dataUrl: string;
  folder: string;
  fileName?: string;
  kind: 'image' | 'document';
}) {
  const { dataUrl, kind } = input;
  const folder = safeSegment(input.folder || kind);
  const fileName = safeFileName(input.fileName || kind);
  const { mimeType, buffer } = parseDataUrl(dataUrl);

  const allowed = kind === 'image' ? IMAGE_MIME_TYPES : DOCUMENT_MIME_TYPES;
  if (!allowed.has(mimeType)) {
    throw new Error(`Unsupported ${kind} type: ${mimeType}`);
  }

  const maxBytes = kind === 'image' ? 8 * 1024 * 1024 : 12 * 1024 * 1024;
  if (buffer.byteLength > maxBytes) {
    throw new Error(`${kind === 'image' ? 'Image' : 'Document'} exceeds size limit`);
  }

  if (cloudinaryEnabled()) {
    return uploadToCloudinary(dataUrl, folder, fileName, kind === 'image' ? 'image' : 'raw');
  }

  return uploadLocally(dataUrl, folder, fileName, mimeType);
}

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  return UPLOAD_DIR;
}
