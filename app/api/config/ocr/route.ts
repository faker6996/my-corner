import { withApiHandler } from '@/lib/utils/withApiHandler';
import { createResponse } from '@/lib/utils/response';

export const GET = withApiHandler(async () => {
  const raw = process.env.OCR_MAX_CONCURRENCY || process.env.NEXT_PUBLIC_OCR_MAX_CONCURRENCY || '5';
  let value = parseInt(String(raw), 10);
  if (!Number.isFinite(value) || value <= 0) value = 5;
  return createResponse({ concurrency: value }, 'OK');
});

