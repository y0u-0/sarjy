import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { learnerRouter } from "./learner";
import { practiceRouter } from "./practice";
import { progressRouter } from "./progress";
import { weatherRouter } from "./weather";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	progress: progressRouter,
	learner: learnerRouter,
	practice: practiceRouter,
	weather: weatherRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
