import 'dotenv/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { readFileSync } from 'fs';

/* ▸ إعداد العميل المتصل بـ DigitalOcean Spaces */
const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!
  }
});

/* ▸ رفع ملف إلى الـ Space */
export async function uploadFile(
  localPath: string,
  key: string,
  isPublic = false
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: readFileSync(path.resolve(localPath)),
    ContentType: 'text/plain',
    ContentDisposition: 'inline',
    ...(isPublic ? { ACL: 'public-read' } : {})
  });
  await s3.send(cmd);
  return `https://${process.env.S3_BUCKET}.fra1.digitaloceanspaces.com/${key}`;
}

/* ▸ توليد رابط موقَّع لملف خاص */
export async function getPresignedUrl(
  key: string,
  expires = 300
): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ResponseContentType: 'text/plain',
    ResponseContentDisposition: 'inline'
  });
  return getSignedUrl(s3, cmd, { expiresIn: expires });
}
