import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userProfilesTable } from "@workspace/db";
import { schemas } from "@workspace/api-zod";
const { UpsertUserProfileBody } = schemas;

const router: IRouter = Router();

router.get("/users/profile", async (req, res): Promise<void> => {
  const sessionId = req.headers["x-session-id"] as string || "default-session";

  const [profile] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.sessionId, sessionId));

  if (!profile) {
    res.status(404).json({ error: "not_found", message: "Profile not found" });
    return;
  }

  res.json({
    id: profile.id.toString(),
    name: profile.name,
    age: profile.age,
    location: profile.location,
    budgetMonthly: profile.budgetMonthly,
    insuranceType: profile.insuranceType,
    priorities: profile.priorities,
    requirements: profile.requirements,
    vehicleDetails: profile.vehicleDetails ?? undefined,
    propertyDetails: profile.propertyDetails ?? undefined,
    onboardingComplete: profile.onboardingComplete === "true",
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

router.put("/users/profile", async (req, res): Promise<void> => {
  const sessionId = req.headers["x-session-id"] as string || "default-session";

  const parsed = UpsertUserProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const data = parsed.data;

  const values = {
    sessionId,
    name: data.name,
    age: data.age,
    location: data.location,
    budgetMonthly: data.budgetMonthly,
    insuranceType: data.insuranceType,
    priorities: data.priorities,
    requirements: data.requirements ?? [],
    vehicleDetails: data.vehicleDetails ?? null,
    propertyDetails: data.propertyDetails ?? null,
    onboardingComplete: data.onboardingComplete ? "true" : "false",
  };

  const [existing] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.sessionId, sessionId));

  let profile;
  if (existing) {
    [profile] = await db
      .update(userProfilesTable)
      .set(values)
      .where(eq(userProfilesTable.sessionId, sessionId))
      .returning();
  } else {
    [profile] = await db
      .insert(userProfilesTable)
      .values(values)
      .returning();
  }

  res.json({
    id: profile.id.toString(),
    name: profile.name,
    age: profile.age,
    location: profile.location,
    budgetMonthly: profile.budgetMonthly,
    insuranceType: profile.insuranceType,
    priorities: profile.priorities,
    requirements: profile.requirements,
    vehicleDetails: profile.vehicleDetails ?? undefined,
    propertyDetails: profile.propertyDetails ?? undefined,
    onboardingComplete: profile.onboardingComplete === "true",
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

export default router;
