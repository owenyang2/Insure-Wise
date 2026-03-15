import type { AdapterContext, HandoffResult } from './types';
import { demoFallback } from './_demo-fallback';

export async function runAllianceProtectionHandoff(context: AdapterContext): Promise<HandoffResult> {
  return demoFallback(context);
}
