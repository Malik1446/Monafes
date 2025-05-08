import 'dotenv/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import path from 'path';

const {
  S3_ENDPOINT,
  S3_REGION,
  S3_BUCKET,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
} = process.env;

if (!S3_ACCESS_KEY || !S3_SECRET_KEY) {
  throw new Error('❌ Verify your .env keys');
}

const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
});

async function main() {
  const localFile = path.resolve('hello.txt');   // ملف محلي موجود بجانب .env
  const keyOnSpace = 'test/hello.txt';           // المسار داخل الـ Space

  const cmd = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: keyOnSpace,
    Body: readFileSync(localFile),
    ACL: 'public-read',                          // اجعل الملف عاماً للاختبار
  });

  await s3.send(cmd);
  console.log(`✅ Uploaded to https://${S3_BUCKET}.fra1.digitaloceanspaces.com/${keyOnSpace}`);
}

main().catch(console.error);
