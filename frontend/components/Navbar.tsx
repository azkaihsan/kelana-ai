"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { logout } from "@/services/authService";

// ── Navbar ────────────────────────────────────────────────────────────────────

interface NavbarProps {
  /** Use "transparent" for pages with a hero background image */
  variant?: "transparent" | "solid";
}

export default function Navbar({ variant = "solid" }: NavbarProps) {
  const router = useRouter();
  const { user, clearUser } = useUser();

  const handleLogout = () => {
    logout();       // remove JWT from localStorage
    clearUser();    // wipe global user state from context
    router.push("/login");
  };

  const isTransparent = variant === "transparent";

  const linkCls = isTransparent
    ? "text-sm font-medium text-white/80 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
    : "text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2";

  const brandCls = isTransparent ? "text-white" : "text-sky-600";

  return (
    <header
      className={
        isTransparent
          ? "absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-4 md:px-10"
          : "border-b border-slate-200 bg-white"
      }
    >
      <div
        className={
          isTransparent
            ? "flex w-full items-center justify-between"
            : "mx-auto flex max-w-5xl w-full items-center justify-between px-5 py-4"
        }
      >
        {/* Brand */}
        <Link
          href="/"
          className={`flex items-center gap-2 text-lg font-bold tracking-tight transition-colors ${brandCls}`}
          aria-label="KelanaAI home"
        >
          <GlobeIcon variant={variant} />
          <span>KelanaAI</span>
        </Link>

        {/* Nav links */}
        <nav aria-label="Primary navigation" className="flex items-center gap-6">

          {/* Personalised welcome message */}
          {user && (
            <span
              className={
                isTransparent
                  ? "hidden md:inline text-sm font-medium text-white/90"
                  : "hidden md:inline text-sm font-medium text-gray-700"
              }
            >
              Welcome back,{" "}
              <span className="font-semibold">{user.name}</span>
            </span>
          )}

          <Link href="/trips" className={linkCls}>
            My Trips
          </Link>

          <Link href="/profile" className={linkCls}>
            Profile
          </Link>

          {/* Logout */}
          <button
            id="navbar-logout-btn"
            onClick={handleLogout}
            className={linkCls}
            aria-label="Log out"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function GlobeIcon({ variant }: { variant: "transparent" | "solid" }) {
  const cls = variant === "transparent" ? "text-white" : "text-sky-600";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`h-6 w-6 ${cls}`}
      aria-hidden="true"
    >
      <path d="M21.721 12.752a9.711 9.711 0 00-.945-5.003 12.754 12.754 0 01-4.339 2.708 18.991 18.991 0 01-.214 4.772 17.165 17.165 0 005.498-2.477zM14.634 15.55a17.324 17.324 0 00.332-4.647c-.952.227-1.945.347-2.966.347-1.021 0-2.014-.12-2.966-.347a17.515 17.515 0 00.332 4.647 17.385 17.385 0 005.268 0zM9.772 17.119a18.963 18.963 0 004.456 0A17.182 17.182 0 0112 21.724a17.18 17.18 0 01-2.228-4.605zM7.777 15.23a18.87 18.87 0 01-.214-4.774 12.753 12.753 0 01-4.34-2.708 9.711 9.711 0 00-.944 5.004 17.165 17.165 0 005.498 2.477zM21.356 14.752a9.765 9.765 0 01-7.478 6.817 18.64 18.64 0 001.988-4.718 18.627 18.627 0 005.49-2.098zM2.644 14.752c1.682.971 3.53 1.688 5.49 2.099a18.64 18.64 0 001.988 4.718 9.765 9.765 0 01-7.478-6.816zM13.878 2.43a9.755 9.755 0 016.116 3.986 11.267 11.267 0 01-3.746 2.504 18.63 18.63 0 00-2.37-6.49zM12 2.276a17.152 17.152 0 012.805 7.121c-.897.23-1.837.353-2.805.353-.968 0-1.908-.122-2.805-.353A17.151 17.151 0 0112 2.276zM10.122 2.43a18.629 18.629 0 00-2.37 6.49 11.266 11.266 0 01-3.746-2.504 9.754 9.754 0 016.116-3.985z" />
    </svg>
  );
}
