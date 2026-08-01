import { Button } from "@sarjy-sql/ui/components/button";
import { Input } from "@sarjy-sql/ui/components/input";
import { cn } from "@sarjy-sql/ui/lib/utils";
import { Mic, MicOff, PhoneOff, Send, X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { useTeacherSelector } from "./teacher-provider";

export function TeacherTranscriptPanel({ onClose }: { onClose: () => void }) {
	const status = useTeacherSelector((teacher) => teacher.status);
	const isMuted = useTeacherSelector((teacher) => teacher.isMuted);
	const transcript = useTeacherSelector((teacher) => teacher.transcript);
	const end = useTeacherSelector((teacher) => teacher.end);
	const toggleMute = useTeacherSelector((teacher) => teacher.toggleMute);
	const ask = useTeacherSelector((teacher) => teacher.ask);
	const [draft, setDraft] = useState("");
	const endRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: transcript is the scroll trigger, not a closure dependency
	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [transcript]);

	function handleSend(event: FormEvent): void {
		event.preventDefault();
		const text = draft.trim();
		if (!text) return;
		ask(text);
		setDraft("");
	}

	return (
		<div className="flex h-[min(26.25rem,calc(100dvh-7rem))] w-[calc(100vw-1rem)] max-w-85 flex-col rounded-3xl border border-border bg-card shadow-none">
			<header className="flex items-center gap-2 border-border border-b px-3 py-2">
				<p className="font-semibold text-foreground text-sm">Sarjy</p>
				<p className="text-muted-foreground text-xs">your SQL teacher</p>
				<div className="ml-auto flex gap-1">
					{status === "connected" && (
						<>
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={toggleMute}
								aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
							>
								{isMuted ? <MicOff className="text-tangerine" /> : <Mic />}
							</Button>
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={end}
								aria-label="End session"
							>
								<PhoneOff className="text-tangerine" />
							</Button>
						</>
					)}
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={onClose}
						aria-label="Close transcript"
					>
						<X />
					</Button>
				</div>
			</header>

			<div className="flex-1 space-y-2 overflow-y-auto p-3">
				{transcript.length === 0 && (
					<p className="pt-8 text-center text-muted-foreground text-xs">
						{status === "connected"
							? "Say hi, or just start working. Sarjy sees your screen."
							: "Tap the orb to start your lesson."}
					</p>
				)}
				{transcript.map((entry) => (
					<div
						key={entry.id}
						className={cn(
							"max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
							entry.role === "agent"
								? "rounded-bl-md bg-muted text-foreground"
								: "ml-auto rounded-br-md bg-periwinkle/25 text-foreground",
						)}
					>
						{entry.text}
					</div>
				))}
				<div ref={endRef} />
			</div>

			{status === "connected" && (
				<form
					onSubmit={handleSend}
					className="flex gap-1 border-border border-t p-2"
				>
					<Input
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
						placeholder="Type to Sarjy…"
						aria-label="Message to teacher"
					/>
					<Button
						type="submit"
						size="icon-sm"
						variant="outline"
						aria-label="Send message"
					>
						<Send />
					</Button>
				</form>
			)}
		</div>
	);
}
