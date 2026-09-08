"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { logout } from "@/services/authService";
import faviconLogo from "@/public/favicon.ico";

// ── Navbar ────────────────────────────────────────────────────────────────────

interface NavbarProps {
  /** Use "transparent" for pages with a hero background image */
  variant?: "transparent" | "solid";
}

export default function Navbar({ variant = "solid" }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearUser } = useUser();

  const handleLogout = () => {
    logout();       // remove JWT from localStorage
    clearUser();    // wipe global user state from context
    router.push("/login");
  };

  const isTransparent = variant === "transparent";

  const isRouteActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const getLinkCls = (href: string) => {
    const active = isRouteActive(href);
    if (isTransparent) {
      return active
        ? "text-sm font-semibold text-white border-b-2 border-white pb-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        : "text-sm font-medium text-white/80 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";
    }

    return active
      ? "text-sm font-semibold text-sky-600 border-b-2 border-sky-600 pb-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
      : "text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2";
  };

  const logoutCls = isTransparent
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
          <Image
            src={faviconLogo}
            alt="KelanaAI Logo"
            width={26}
            height={26}
            className="h-6.5 w-6.5 rounded-md object-contain shadow-xs"
            priority
          />
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

          <Link
            href="/trips"
            className={getLinkCls("/trips")}
            aria-current={isRouteActive("/trips") ? "page" : undefined}
          >
            My Trips
          </Link>

          <Link
            href="/chat"
            className={getLinkCls("/chat")}
            aria-current={isRouteActive("/chat") ? "page" : undefined}
          >
            Chat
          </Link>

          <Link
            href="/assistant"
            className={getLinkCls("/assistant")}
            aria-current={isRouteActive("/assistant") ? "page" : undefined}
          >
            Assistant
          </Link>

          <Link
            href="/profile"
            className={getLinkCls("/profile")}
            aria-current={isRouteActive("/profile") ? "page" : undefined}
          >
            Profile
          </Link>

          <Link
            href="/about"
            className={getLinkCls("/about")}
            aria-current={isRouteActive("/about") ? "page" : undefined}
          >
            About
          </Link>

          {/* Logout */}
          <button
            id="navbar-logout-btn"
            onClick={handleLogout}
            className={logoutCls}
            aria-label="Log out"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

