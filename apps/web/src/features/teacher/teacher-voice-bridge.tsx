import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useEffect, useMemo } from "react";

import { client } from "@/utils/orpc";

import { createTeacherClientTools } from "./teacher-client-tools";
import type { TeacherRuntime } from "./teacher-runtime";
import type { TeacherStatus } from "./teacher-types";
import { createTeacherConversationOptions } from "./teacher-voice-events";

function TeacherVoiceBridge({ runtime }: { runtime: TeacherRuntime }) {
	const clientTools = useMemo(
		() => createTeacherClientTools(runtime, client),
		[runtime],
	);
	const options = useMemo(
		() => createTeacherConversationOptions(runtime, clientTools, client),
		[clientTools, runtime],
	);
	const conversation = useConversation(options);
	const {
		startSession,
		endSession,
		sendUserMessage,
		sendContextualUpdate,
		sendUserActivity,
		setMuted,
		getInputVolume,
		getOutputVolume,
		status,
		isSpeaking,
		isMuted,
	} = conversation;

	useEffect(() => {
		runtime.attachVoice({
			startSession,
			endSession,
			sendUserMessage,
			sendContextualUpdate,
			sendUserActivity,
			setMuted,
			getInputVolume,
			getOutputVolume,
		});
		return () => runtime.attachVoice(null);
	}, [
		endSession,
		getInputVolume,
		getOutputVolume,
		runtime,
		sendContextualUpdate,
		sendUserActivity,
		sendUserMessage,
		setMuted,
		startSession,
	]);

	useEffect(() => {
		runtime.syncVoiceState({
			status: status as TeacherStatus,
			isSpeaking,
			isMuted,
		});
	}, [isMuted, isSpeaking, runtime, status]);

	return null;
}

export function TeacherVoiceBridgeProvider({
	runtime,
}: {
	runtime: TeacherRuntime;
}) {
	return (
		<ConversationProvider>
			<TeacherVoiceBridge runtime={runtime} />
		</ConversationProvider>
	);
}
