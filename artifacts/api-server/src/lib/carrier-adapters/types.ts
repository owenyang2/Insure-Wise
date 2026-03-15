import type { UserProfile } from '@workspace/db';

export type AdapterContext = {
  userProfile: UserProfile;
  policyId: string;
  planName: string;
  monthlyPremium: number;
};

export type HandoffResult = {
  status: 'success' | 'fallback';
  checkoutUrl: string;
  expiresIn?: number;
  message?: string;
};
