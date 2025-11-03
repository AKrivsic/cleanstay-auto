import Link from 'next/link'

export default function AdminShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="admin-dashboard">
			<header className="admin-header">
				<h1>Admin</h1>
			</header>
			<div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
				<aside className="admin-sidebar">
					<nav>
						<h3 style={{ marginTop: 0 }}>Navigace</h3>
						<ul style={{ padding: 0, margin: 0, display: 'grid', gap: 8, listStyle: 'none' }}>
							<li><Link href="/dashboard">Správa</Link></li>
							<li><Link href="/dashboard/cleanings">Úklid</Link></li>
							<li><Link href="/dashboard/messages">Zprávy</Link></li>
							<li><Link href="/dashboard/properties">Nemovitosti</Link></li>
							<li><Link href="/dashboard/metrics">Reporty</Link></li>
						</ul>
					</nav>
				</aside>
				<main className="admin-main">
					{children}
				</main>
			</div>
		</div>
	)
}


