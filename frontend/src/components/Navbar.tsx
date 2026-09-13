import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLink = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium pb-1 border-b-2 transition-colors ${
    isActive ? "border-river text-ink" : "border-transparent text-ink/60 hover:text-ink"
  }`;

export function Navbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <header className="border-b border-ink/10 bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">Riverside</span>
          <span className="font-display text-xl text-river">Community Hub</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <NavLink to="/facilities" className={navLink}>
            Facilities
          </NavLink>
          <NavLink to="/donate" className={navLink}>
            Donate
          </NavLink>
          {profile?.role === "member" && (
            <NavLink to="/dashboard" className={navLink}>
              My bookings
            </NavLink>
          )}
          {(profile?.role === "staff" || profile?.role === "admin") && (
            <NavLink to="/admin" className={navLink}>
              Staff dashboard
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden text-sm text-ink/60 sm:inline">{profile?.full_name ?? "…"}</span>
              <button onClick={handleSignOut} className="btn-secondary text-sm">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink/70 hover:text-ink">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary text-sm">
                Become a member
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
