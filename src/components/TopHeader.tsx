"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Sun,
  Moon,
  RefreshCw,
  X,
  LogOut,
  LogIn,
  ShieldCheck,
  UserPlus,
  UserRound,
  Home,
  Info,
  Mail,
  FileText,
  BookOpenCheck,
  CreditCard,
  Receipt,
  LayoutDashboard,
} from "lucide-react";

type Theme = "light" | "dark" | "auto";
type SessionUser = { id: number; regNo: string; email: string; name: string | null; role: string } | null;

const THEME_ICONS: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, auto: RefreshCw };

export function TopHeader() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "auto";
    return (localStorage.getItem("theme") as Theme) || "auto";
  });
  const [themeOpen, setThemeOpen] = useState(false);
  const [user, setUser] = useState<SessionUser>(null);
  const [userOpen, setUserOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else if (t === "light") root.classList.remove("dark");
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark");
    else root.classList.remove("dark");
  };

  useEffect(() => {
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("auto");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  // Fetch session on mount + after navigation
  useEffect(() => {
    let live = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (live) setUser(d?.user ?? null);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [router]);

  // Close dropdowns on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setUserOpen(false);
    setMenuOpen(false);
    setLoggingOut(false);
    router.push("/");
    router.refresh();
  }

  const ThemeIcon = THEME_ICONS[theme];
  const initials = user
    ? (user.name || user.regNo).slice(0, 2).toUpperCase()
    : "";

  const menuItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/about", label: "About", icon: Info },
    { href: "/contact", label: "Contact Us", icon: Mail },
    { href: "/exam", label: "Exam", icon: FileText },
    { href: "/buy", label: "BUY NOW", icon: CreditCard },
    { href: "/books", label: "Library", icon: FileText },
    { href: "/practice", label: "Practice", icon: BookOpenCheck },
    { href: "/developer", label: "Website Management", icon: UserRound },
    { href: "/admin/purchases", label: "Payment History", icon: Receipt },
    { href: "/admin", label: "Admin", icon: ShieldCheck },
    { href: "/admin/devbox", label: "DevBox", icon: LayoutDashboard },
    ...(!user
      ? [{ href: "/signup", label: "Sign Up", icon: UserPlus }, { href: "/login", label: "Login", icon: LogIn }]
      : []),
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between bg-linear-to-r from-orange-500 via-orange-600 to-amber-600 px-4 shadow-lg shadow-orange-900/20">
        <Link href="/" className="font-display text-sm sm:text-lg font-bold tracking-tight text-white truncate max-w-[200px] sm:max-w-none">
          Quiz nptel Skylashtechog
        </Link>

        <div className="flex items-center gap-1.5">
          {/* Search */}
          <button
            aria-label="Search"
            className="rounded-full p-2 text-white/90 transition hover:bg-white/15 hover:text-white"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          {/* Theme */}
          <div className="relative" ref={themeRef}>
            <button
              aria-label="Theme"
              onClick={() => setThemeOpen((v) => !v)}
              className="rounded-full p-2 text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              <ThemeIcon className="h-[18px] w-[18px]" />
            </button>
            {themeOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-[150px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                {(["light", "dark", "auto"] as Theme[]).map((t) => {
                  const Icon = THEME_ICONS[t];
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setTheme(t);
                        setThemeOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition hover:bg-slate-100 ${
                        theme === t ? "bg-orange-50 font-semibold text-orange-700" : "text-slate-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="capitalize">{t}</span>
                      {theme === t && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* User chip or hamburger */}
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserOpen((v) => !v)}
                className="ml-1 flex items-center gap-2 rounded-full bg-white/15 py-1 pl-1 pr-3 text-white transition hover:bg-white/25"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[11px] font-black text-orange-600">
                  {initials}
                </span>
                <span className="hidden max-w-[90px] truncate text-xs font-bold sm:block">{user.regNo}</span>
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <div className="text-sm font-bold text-slate-900">{user.name || user.regNo}</div>
                    <div className="truncate text-xs text-slate-500">{user.email}</div>
                    <span
                      className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        user.role === "admin" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                      {user.role}
                    </span>
                  </div>
                  <>
                    <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                      <ShieldCheck className="h-4 w-4 text-orange-600" /> Admin Panel
                    </Link>
                    <Link href="/admin/devbox" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                      <LayoutDashboard className="h-4 w-4 text-orange-600" /> DevBox
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                      <UserRound className="h-4 w-4 text-orange-600" /> Users & Logins
                    </Link>
                  </>
                  <button
                    onClick={logout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" /> {loggingOut ? "Signing out…" : "Logout"}
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Hamburger */}
          <button
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
            className="rounded-full p-2 text-white/90 transition hover:bg-white/15 hover:text-white"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      {/* Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-60 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="animate-slide-in relative ml-auto flex h-full w-72 flex-col bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <div>
                <h3 className="font-display text-lg font-bold">Menu</h3>
                {user && (
                  <span className={`inline-flex mt-1 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${user.role === "admin" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                    {user.role} · {user.regNo}
                  </span>
                )}
              </div>
              <button onClick={() => setMenuOpen(false)} className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-orange-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            {user ? (
              <div className="border-t border-slate-100 p-3 dark:border-slate-800">
                <button
                  onClick={logout}
                  disabled={loggingOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" /> {loggingOut ? "Signing out…" : "Logout"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                  <LogIn className="h-3.5 w-3.5" /> Login
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white transition hover:bg-orange-700">
                  <UserPlus className="h-3.5 w-3.5" /> Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-14" />
    </>
  );
}
