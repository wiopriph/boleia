import imageCompression from 'browser-image-compression';


export type Bucket = 'avatars' | 'vehicles' | 'verifications';

const MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export interface UploadResult {
  // "<uid>/<file>", what submit_verification expects
  path: string
  // null for the private verifications bucket
  publicUrl: string | null
}

// Compresses on the client, uploads to <uid>/<uuid>.<ext>. Public buckets get a public URL that
// goes straight into avatar_url / photo_url; verifications keep the path.
export function useUpload() {
  const db = useDb();
  const userId = useUserId();

  async function compress(file: File, maxSide: number): Promise<Blob> {
    if (!IMAGE_TYPES.includes(file.type)) {
      return file;
    }

    return imageCompression(file, {
      maxWidthOrHeight: maxSide,
      maxSizeMB: 1,
      initialQuality: 0.8,
      fileType: 'image/jpeg',
      useWebWorker: true,
    });
  }

  async function upload(bucket: Bucket, file: File, opts: { maxSide?: number, allowPdf?: boolean } = {}): Promise<UploadResult> {
    if (!userId.value) {
      throw new BoleiaError('NOT_AUTHENTICATED');
    }

    const isImage = IMAGE_TYPES.includes(file.type);
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !(opts.allowPdf && isPdf)) {
      throw new BoleiaError('FILE_TYPE_INVALID');
    }

    const blob = await compress(file, opts.maxSide ?? 1600);

    if (blob.size > MAX_BYTES) {
      throw new BoleiaError('FILE_TOO_LARGE');
    }

    const ext = isPdf ? 'pdf' : 'jpg';
    const path = `${userId.value}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from(bucket).upload(path, blob, { contentType: blob.type, upsert: false });

    if (error) {
      throw new BoleiaError('UPLOAD_FAILED', error);
    }

    const publicUrl = bucket === 'verifications' ? null : db.storage.from(bucket).getPublicUrl(path).data.publicUrl;

    return { path, publicUrl };
  }

  return { upload };
}
