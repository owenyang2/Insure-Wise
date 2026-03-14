import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import insuranceRouter from "./insurance";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(insuranceRouter);
router.use(aiRouter);

export default router;
