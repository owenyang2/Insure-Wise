import { Router, type IRouter } from "express";
import { schemas } from "@workspace/api-zod";
const { HealthCheckResponse } = schemas;

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
