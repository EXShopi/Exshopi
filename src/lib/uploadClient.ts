import { supabase } from '../supabaseClient';

const DEFAULT_BUCKET = 'product-images';

const getBucketName = () =>
  (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET).trim();

const getFileExtensionFromMime = (mimeType: string) => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  };

  return map[mimeType] || 'bin';
};

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error('Failed to convert file to uploadable blob.');
  }
  return response.blob();
};

const buildStoragePath = ({
  folder,
  fileName,
  mimeType,
}: {
  folder?: string;
  fileName?: string;
  mimeType?: string;
}) => {
  const safeFolder = (folder || 'products').replace(/^\/+|\/+$/g, '');
  const baseName = sanitizeFileName(fileName || `file-${Date.now()}`) || `file-${Date.now()}`;
  const extension =
    fileName?.split('.').pop()?.toLowerCase() ||
    getFileExtensionFromMime(mimeType || '');
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${safeFolder}/${baseName}-${uniqueSuffix}.${extension}`;
};

const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

async function uploadBlobToSupabase(
  blob: Blob,
  options?: { folder?: string; fileName?: string }
) {
  const bucket = getBucketName();
  const path = buildStoragePath({
    folder: options?.folder,
    fileName: options?.fileName,
    mimeType: blob.type,
  });

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    cacheControl: '3600',
    upsert: false,
    contentType: blob.type || undefined,
  });

  if (error) {
    throw new Error(
      `Supabase upload failed: ${error.message}. Make sure bucket "${bucket}" exists and allows uploads.`
    );
  }

  return getPublicUrl(bucket, path);
}

export const fileToDataUrl = async (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

export async function uploadImageFile(
  file: File,
  options?: { folder?: string; fileName?: string }
) {
  return uploadBlobToSupabase(file, {
    folder: options?.folder || 'products',
    fileName: options?.fileName || file.name,
  });
}

export async function uploadDocumentFile(
  file: File,
  options?: { folder?: string; fileName?: string }
) {
  return uploadBlobToSupabase(file, {
    folder: options?.folder || 'documents',
    fileName: options?.fileName || file.name,
  });
}

export async function uploadImageDataUrl(
  dataUrl: string,
  options?: { folder?: string; fileName?: string }
) {
  const blob = await dataUrlToBlob(dataUrl);
  return uploadBlobToSupabase(blob, {
    folder: options?.folder || 'products',
    fileName: options?.fileName || `image-${Date.now()}.jpg`,
  });
}