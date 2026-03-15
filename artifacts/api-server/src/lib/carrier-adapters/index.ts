import type { AdapterContext, HandoffResult } from './types';
import { demoFallback } from './_demo-fallback';
import { runShieldInsuranceHandoff } from './shield-insurance';
import { runSafewayAutoHandoff } from './safeway-auto';
import { runAllianceProtectionHandoff } from './alliance-protection';
import { runNationwideDirectHandoff } from './nationwide-direct';
import { runMetroInsuranceHandoff } from './metro-insurance';

const ADAPTER_MAP: Record<string, (ctx: AdapterContext) => Promise<HandoffResult>> = {
  'auto-shield-premium': runShieldInsuranceHandoff,
  'safeway-basic': runSafewayAutoHandoff,
  'alliance-gold': runAllianceProtectionHandoff,
  'nationwide-value': runNationwideDirectHandoff,
  'metro-elite': runMetroInsuranceHandoff,
  'home-guardian-plus': demoFallback,
  'home-safeco-basic': demoFallback,
  'home-elite-shield': demoFallback,
};

export async function runCarrierHandoff(context: AdapterContext): Promise<HandoffResult> {
  const handler = ADAPTER_MAP[context.policyId];
  if (handler) {
    return handler(context);
  }
  return demoFallback(context);
}
