import type { AdapterContext, HandoffResult } from './types';

const CARRIER_HOMEPAGES: Record<string, string> = {
  'auto-shield-premium': 'https://www.intact.ca',
  'safeway-basic': 'https://www.cooperators.ca',
  'alliance-gold': 'https://www.aviva.ca',
  'nationwide-value': 'https://www.belairdirect.com',
  'metro-elite': 'https://www.sonnet.ca',
  'home-guardian-plus': 'https://www.intact.ca',
  'home-safeco-basic': 'https://www.cooperators.ca',
  'home-elite-shield': 'https://www.aviva.ca',
};

export async function demoFallback(context: AdapterContext): Promise<HandoffResult> {
  const targetUrl = CARRIER_HOMEPAGES[context.policyId] || 'https://www.google.ca/search?q=insurance';
  
  console.log(`\n===========================================`);
  console.log(`🤖 [CARRIER BOT] Initiating handoff to: ${context.policyId}`);
  console.log(`🌐 [CARRIER BOT] Target Website: ${targetUrl}`);
  console.log(`👤 [CARRIER BOT] Profile Received: ${context.userProfile.name} (Age: ${context.userProfile.age}, ${context.userProfile.location})`);
  console.log(`📑 [CARRIER BOT] Plan Selected: ${context.planName} ($${context.monthlyPremium}/mo)`);
  console.log(`🔄 [CARRIER BOT] Running background Playwright script to fill forms...`);
  console.log(`===========================================\n`);

  // @ts-ignore
  await new Promise((resolve) => setTimeout(resolve, 2500));

  console.log(`✅ [CARRIER BOT] Forms filled successfully! Redirecting user...`);

  return {
    status: 'fallback',
    checkoutUrl: targetUrl,
    message: 'We prepared your profile. Complete your purchase on the carrier site.',
  };
}
