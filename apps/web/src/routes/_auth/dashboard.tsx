import { Button } from "@sarjy-sql/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_auth/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	const { session } = Route.useRouteContext();

	return (
		<div className="mx-auto flex max-w-2xl animate-rise flex-col items-start gap-6 px-6 py-16">
			<h1 className="font-extrabold text-4xl tracking-tight">
				Welcome back, {session?.user.name}.
			</h1>
			<p className="text-lg text-muted-foreground">
				Pick up where you left off and keep your streak alive. The sandbox
				resets every run, so you can't break anything.
			</p>
			<Button render={<Link to="/learn" />}>
				Continue learning
				<ArrowRight />
			</Button>
		</div>
	);
}
