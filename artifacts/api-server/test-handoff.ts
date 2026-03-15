import { runCarrierHandoff } from "./src/lib/carrier-adapters/index";

async function runTest() {
  console.log("Starting Carrier Handoff Local Test...\n");

  const mockUserProfile: any = {
    id: 1,
    sessionId: "test-session-123",
    name: "John Doe",
    age: 35,
    location: "Toronto, ON",
    budgetMonthly: 150,
    insuranceType: "auto",
    priorities: { price: 40, coverage: 40, rating: 20 },
    requirements: ["Comprehensive coverage", "Low deductible"],
    vehicleDetails: { make: "Toyota", model: "Corolla", year: 2021, vin: "ABC123XYZ" },
    propertyDetails: null,
    onboardingComplete: "true",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const handoffResult = await runCarrierHandoff({
    userProfile: mockUserProfile,
    policyId: "auto-shield-premium",
    planName: "Auto Shield Premium Max",
    monthlyPremium: 142.50,
  });

  console.log("\n📦 RESULT RETURNED TO API (HandoffResult):");
  console.log(JSON.stringify(handoffResult, null, 2));
}

runTest().catch((err) => {
  console.error("Test failed:", err);
});
