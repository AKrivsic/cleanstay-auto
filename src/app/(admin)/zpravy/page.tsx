import { Suspense } from 'react'
import MessagesList from './_components/MessagesList'

export const runtime = 'nodejs'
export const revalidate = 0

export default async function ZpravyPage() {
	return (
		<div className="admin-dashboard">
			<header className="admin-header">
				<h1>Zprávy</h1>
			</header>
			<div className="admin-content">
				<div className="admin-main">
					<Suspense fallback={<div>Načítání zpráv…</div>}>
						<MessagesList />
					</Suspense>
				</div>
			</div>
		</div>
	)
}
