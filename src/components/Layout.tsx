import { Outlet, Link } from 'react-router-dom'
import ContourDivider from './ContourDivider'

// Shared chrome for every page: header with nav, footer with contact info.
// Individual pages only render their own main content.
export default function Layout() {
  return (
    <div className="min-h-screen bg-stone flex flex-col">
      <header className="flex items-center justify-between px-7 py-4 border-b border-border-soft">
        <Link to="/" className="font-display text-lg font-semibold text-ink">
          Akash Homestay
        </Link>
        <nav className="flex gap-5 text-sm">
          <Link to="/" className="text-ink">
            Rooms
          </Link>
          <Link to="/owner" className="text-muted">
            Owner login
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="px-7 py-6 border-t border-border-soft">
        <ContourDivider />
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-muted">Akash Homestay · Rishikesh, Uttarakhand</p>
          <p className="text-xs text-muted">contact@akashhomestay.example</p>
        </div>
      </footer>
    </div>
  )
}
