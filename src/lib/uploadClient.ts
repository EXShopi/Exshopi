import { uploadAPI } from '../services/api';

export const fileToDataUrl = async (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

export async function uploadImageFile(file: File, options?: { folder?: string; fileName?: string }) {
  const dataUrl = await fileToDataUrl(file);
  const result = await uploadAPI.uploadImage(dataUrl, {
    folder: options?.folder,
    fileName: options?.fileName || file.name,
  });
  return String(result?.url || '');
}

export async function uploadDocumentFile(file: File, options?: { folder?: string; fileName?: string }) {
  const dataUrl = await fileToDataUrl(file);
  const result = await uploadAPI.uploadDocument(dataUrl, {
    folder: options?.folder,
    fileName: options?.fileName || file.name,
  });
  return String(result?.url || '');
}

export async function uploadImageDataUrl(dataUrl: string, options?: { folder?: string; fileName?: string }) {
  const result = await uploadAPI.uploadImage(dataUrl, options);
  return String(result?.url || '');
}
