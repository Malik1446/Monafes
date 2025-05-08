import { uploadFile, getPresignedUrl } from "./s3.service";

async function test() {
  // 1) رفع عام (Public)
  const publicUrl = await uploadFile("hello.txt", "service-test/hello.txt", true);
  console.log("✅ Public URL:", publicUrl);

  // 2) رفع خاص ثم توليد رابط موقَّع (Private)
  await uploadFile("hello.txt", "private/hello.txt", false);
  const signedUrl = await getPresignedUrl("private/hello.txt", 300);
  console.log("🔗 Signed URL (5 min):", signedUrl);
}

test().catch(console.error);
