import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";
import { runCarrierHandoff } from "../lib/carrier-adapters/index";

const router: IRouter = Router();

router.post("/checkout/handoff", async (req, res): Promise<void> => {
  try {
    const { userProfileId, policyId, planName, monthlyPremium } = req.body;

    // 1. Validate that all four fields are present
    if (!userProfileId || !policyId || !planName || typeof monthlyPremium !== 'number') {
      res.status(400).json({ error: "bad_request", message: "Missing required fields" });
      return;
    }

    // 2. Query the existing userProfilesTable
    const [profile] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, parseInt(userProfileId, 10)));

    if (!profile) {
      res.status(404).json({ error: "not_found", message: "Profile not found" });
      return;
    }

    // 3. Call runCarrierHandoff
    const handoffResult = await runCarrierHandoff({
      userProfile: profile,
      policyId,
      planName,
      monthlyPremium,
    });

    // 4. Return the HandoffResult as JSON
    res.json(handoffResult);
  } catch (error: any) {
    // 5. Catch any errors and return 500
    res.status(500).json({ error: "handoff_failed", message: error.message });
  }
});

export default router;
