import type { AdapterContext, HandoffResult } from './types';
import { demoFallback } from './_demo-fallback';

export async function runNationwideDirectHandoff(context: AdapterContext): Promise<HandoffResult> {
  return demoFallback(context);
}
