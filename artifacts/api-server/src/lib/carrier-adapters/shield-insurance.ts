import type { AdapterContext, HandoffResult } from './types';
import { demoFallback } from './_demo-fallback';

export async function runShieldInsuranceHandoff(context: AdapterContext): Promise<HandoffResult> {
  return demoFallback(context);
}
