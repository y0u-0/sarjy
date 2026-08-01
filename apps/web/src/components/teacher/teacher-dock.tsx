import { cn } from "@sarjy-sql/ui/lib/utils";
import { MicOff } from "lucide-react";
import { useState } from "react";

import type { TeacherConnectionIssue } from "@/lib/teacher/teacher-connection";

import { SarjyOrb, type SarjyState } from "./sarjy-orb";
import { useTeacherSelector } from "./teacher-provider";
import { TeacherTranscriptPanel } from "./teacher-transcript-panel";

function agentStateFor(status: string, isSpeaking: boolean): SarjyState {
	if (status === "connecting") return "thinking";
	if (status !== "connected") return null;
	if (isSpeaking) return "talking";
	return "listening";
}

function statusLabel(
	status: string,
	isSpeaking: boolean,
	userTalking: boolean,
): string {
	if (status === "connecting") return "Connecting…";
	if (status !== "connected") return "Tap to talk to Sarjy";
	if (isSpeaking) return "Sarjy is speaking";
	if (userTalking) return "Hearing you…";
	return "Listening";
}

function ConnectionAlert({ issue }: { issue: TeacherConnectionIssue }) {
	return (
		<div
			role="alert"
			className="max-w-72 animate-stamp rounded-2xl border border-tangerine/45 bg-ink-soft px-4 py-3 text-left shadow-none"
		>
			<p className="font-semibold text-foreground text-sm">{issue.title}</p>
			<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
				{issue.detail}
			</p>
		</div>
	);
}

export function TeacherDock() {
	const status = useTeacherSelector((teacher) => teacher.status);
	const isSpeaking = useTeacherSelector((teacher) => teacher.isSpeaking);
	const userTalking = useTeacherSelector((teacher) => teacher.userTalking);
	const isMuted = useTeacherSelector((teacher) => teacher.isMuted);
	const issue = useTeacherSelector((teacher) => teacher.connectionIssue);
	const transcript = useTeacherSelector((teacher) => teacher.transcript);
	const start = useTeacherSelector((teacher) => teacher.start);
	const getInputVolume = useTeacherSelector(
		(teacher) => teacher.getInputVolume,
	);
	const getOutputVolume = useTeacherSelector(
		(teacher) => teacher.getOutputVolume,
	);
	const [open, setOpen] = useState(false);

	const lastAgentMessage = [...transcript]
		.reverse()
		.find((entry) => entry.role === "agent");
	const label = statusLabel(status, isSpeaking, userTalking);

	function handleOrbClick(): void {
		if (status === "disconnected" || status === "error") {
			void start();
			return;
		}
		setOpen((value) => !value);
	}

	return (
		<div className="fixed right-2 bottom-2 z-50 flex max-w-[calc(100vw-1rem)] flex-col items-end gap-2 sm:right-5 sm:bottom-5">
			{open && <TeacherTranscriptPanel onClose={() => setOpen(false)} />}
			{!open && status !== "connected" && status !== "connecting" && issue && (
				<ConnectionAlert issue={issue} />
			)}
			{!open && status === "connected" && isSpeaking && lastAgentMessage && (
				<div className="max-w-72 animate-stamp rounded-2xl border border-ink bg-cream px-4 py-2.5 text-ink text-sm shadow-none">
					{lastAgentMessage.text}
				</div>
			)}
			<div className="flex items-center gap-2">
				{status === "connected" && isMuted && (
					<span className="flex items-center gap-1 rounded-full border border-tangerine/60 bg-tangerine/15 px-2.5 py-1 text-tangerine text-xs">
						<MicOff className="size-3" /> muted
					</span>
				)}
				<button
					type="button"
					onClick={handleOrbClick}
					aria-label={label}
					title={label}
					className={cn(
						"size-19 cursor-pointer rounded-full transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95 motion-reduce:active:scale-100",
						status === "connected"
							? "opacity-100"
							: "opacity-85 hover:opacity-100",
					)}
				>
					<SarjyOrb
						state={agentStateFor(status, isSpeaking)}
						getInputVolume={getInputVolume}
						getOutputVolume={getOutputVolume}
						className="size-full"
					/>
				</button>
			</div>
		</div>
	);
}
