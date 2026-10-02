import { issueSignedToken, presignUrl } from '@vercel/blob';

/**
 * Vercel Blob has two auth modes: a read-write token (older stores) or OIDC + BLOB_STORE_ID (newer stores).
 * Client uploads use classic tokens in the first case and presigned URLs in the second.
 */
export type BlobMode = 'token' | 'presigned';

// the store connected to the project (BLOB_STORE_ID) wins — a leftover read-write token may belong to another store
export function blobMode(): BlobMode | null {
  if (process.env.BLOB_STORE_ID) return 'presigned';
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'token';
  return null;
}

export function storeId(): string {
  const rw = process.env.BLOB_READ_WRITE_TOKEN;
  const id = process.env.BLOB_STORE_ID || (rw ? rw.split('_')[3] ?? '' : '');
  return (id.startsWith('store_') ? id.slice(6) : id).toLowerCase();
}

export function publicUrl(pathname: string): string {
  return `https://${storeId()}.public.blob.vercel-storage.com/${pathname}`;
}

export const UPLOAD_TYPES = ['video/*', 'image/*', 'audio/*'];
export const MAX_UPLOAD = 4 * 1024 ** 3;

/** Presigned PUT url for one exact pathname (oidc stores). */
export async function presignedPut(pathname: string, contentTypes = UPLOAD_TYPES, hours = 1): Promise<string> {
  const token = await issueSignedToken({
    pathname,
    operations: ['put'],
    allowedContentTypes: contentTypes,
    maximumSizeInBytes: MAX_UPLOAD,
    validUntil: Date.now() + hours * 3600_000,
  });
  const { presignedUrl } = await presignUrl(token, {
    operation: 'put',
    pathname,
    access: 'public',
    allowedContentTypes: contentTypes,
    maximumSizeInBytes: MAX_UPLOAD,
  });
  return presignedUrl;
}

/**
 * Where a third party (ios shortcut, render worker) may PUT one file, plus the public url it will have.
 * Works with both store modes.
 */
export async function uploadTarget(pathname: string, contentType: string, contentTypes = UPLOAD_TYPES, hours = 1) {
  const headers: Record<string, string> = {
    'x-api-version': '12',
    'x-vercel-blob-access': 'public',
    'x-content-type': contentType,
    'x-add-random-suffix': '0',
  };
  if (blobMode() === 'presigned') {
    return { url: await presignedPut(pathname, contentTypes, hours), method: 'PUT', headers, publicUrl: publicUrl(pathname) };
  }
  const { generateClientTokenFromReadWriteToken } = await import('@vercel/blob/client');
  const token = await generateClientTokenFromReadWriteToken({
    pathname,
    allowedContentTypes: contentTypes,
    maximumSizeInBytes: MAX_UPLOAD,
    addRandomSuffix: false,
    validUntil: Date.now() + hours * 3600_000,
  });
  return {
    url: `https://vercel.com/api/blob/?pathname=${encodeURIComponent(pathname)}`,
    method: 'PUT',
    headers: { ...headers, authorization: `Bearer ${token}` },
    publicUrl: publicUrl(pathname),
  };
}
