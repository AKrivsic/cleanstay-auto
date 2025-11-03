"use client";
import { useEffect, useState } from 'react';
import ChatThread from '@/components/Chatbot/ChatThread'

export default function ChatEmbedPage() {
	const [sessionId, setSessionId] = useState('');

	useEffect(() => {
		try {
			let id = localStorage.getItem('chatSessionId');
			if (!id) { id = crypto.randomUUID(); localStorage.setItem('chatSessionId', id); }
			setSessionId(id);
		} catch {}
	}, []);

	return (
		<div style={{ width: '100%', height: '100vh' }}>
			<div id="chat-panel" style={{ position: 'static', width: '100%', height: '100vh' }}>
				{sessionId && <ChatThread sessionId={sessionId} />}
			</div>
		</div>
	)
}


