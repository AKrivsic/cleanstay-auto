"use client";
import { useEffect, useState } from 'react';
import SidebarHost from './SidebarHost';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
	const [isMobile, setIsMobile] = useState(false);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const onResize = () => setIsMobile(window.innerWidth < 768);
		onResize();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	useEffect(() => {
		if (!isMobile) setOpen(true);
		else setOpen(false);
	}, [isMobile]);

	return (
		<div className="admin-dashboard">
			<header className="admin-header">
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					{isMobile && (
						<button aria-label="Menu" onClick={() => setOpen(v => !v)} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', background: '#fff', cursor: 'pointer' }}>☰</button>
					)}
					<h1 style={{ margin: 0 }}>Admin</h1>
				</div>
			</header>
			{open && <SidebarHost />}
			<div className="admin-main" style={{ paddingLeft: !isMobile ? '280px' : 0, paddingRight: '24px', paddingTop: '24px' }}>
				{children}
			</div>
		</div>
	);
}


