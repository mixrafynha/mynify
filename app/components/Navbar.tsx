"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

/* SAFE DATA */
const LINKS = Object.freeze([
  { name: "Catalog", href: "/catalog" },
  { name: "How it works", dropdown: ["How Mynify works"] },
  { name: "Pricing", href: "/pricing" },
  { name: "Blog", href: "/blog" },
  { name: "Support", dropdown: [ "Contact"] },
]);

/* 🔐 SAFE SLUG GENERATOR (fixed XSS risk) */
const formatLink = (text: string): string => {
  if (typeof text !== "string") return "/";

  const cleaned = text
    .replace(/[<>\"'`]/g, "") // remove injection chars
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  return cleaned ? `/${cleaned}` : "/";
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  // 🔐 safer auth state (avoid null flicker issues)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [clickedDropdown, setClickedDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    const controller = new AbortController();

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();

    return () => controller.abort();
  }, []);

  const isOpen = useCallback(
    (name: string) =>
      clickedDropdown === name || activeDropdown === name,
    [clickedDropdown, activeDropdown]
  );

  const toggleDropdown = useCallback((name: string) => {
    setClickedDropdown((prev) => (prev === name ? null : name));
  }, []);

  const toggleMobileDropdown = useCallback((name: string) => {
    setMobileOpen((prev) => (prev === name ? null : name));
  }, []);

  const toggleSidebar = useCallback(() => {
    setOpen((p) => !p);
  }, []);

  const closeSidebar = useCallback(() => {
    setOpen(false);
    setMobileOpen(null);
  }, []);

  const links = useMemo(() => LINKS, []);

  /* 🔐 SSR SAFE GUARD */
  if (!mounted || !authChecked || pathname === "/signup") return null;

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={toggleSidebar}
              className="lg:hidden text-2xl"
            >
              ☰
            </button>

            <Link
              href="/"
              className="text-xl sm:text-3xl font-extrabold tracking-tight"
            >
              MY<span className="text-green-500">NIFY</span>
            </Link>
          </div>

          {/* DESKTOP */}
          <div className="hidden lg:flex items-center gap-12 text-[16px] font-medium text-gray-800">
            {links.map((link) => (
              <div
                key={link.name}
                className="relative"
                onMouseEnter={() => setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="flex items-center gap-1 cursor-pointer group">

                  {!link.dropdown ? (
                    <Link
                      href={link.href ?? "/"}
                      className="hover:text-green-500 transition"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleDropdown(link.name)}
                      className="hover:text-green-500 transition"
                    >
                      {link.name}
                    </button>
                  )}

                  {link.dropdown && (
                    <ChevronDown
                      size={16}
                      className={`transition ${
                        isOpen(link.name) ? "rotate-180 text-green-500" : ""
                      }`}
                    />
                  )}
                </div>

                {link.dropdown && (
                  <div
                    className={`absolute top-full left-0 pt-4 transition ${
                      isOpen(link.name)
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="bg-white shadow-xl rounded-2xl p-3 min-w-[220px] border">
                      {link.dropdown.map((item) => (
                        <Link
                          key={item}
                          href={formatLink(item)}
                          className="block px-4 py-2 text-sm hover:bg-gray-100 rounded-lg"
                        >
                          {item}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2 sm:gap-3">

            {!isAuthenticated ? (
              <>
                <Link href="/login">
                  <button className="px-4 py-2 border rounded-xl">
                    Log in
                  </button>
                </Link>

                <Link href="/signup">
                  <button className="px-5 py-2 rounded-xl text-white bg-green-500">
                    Sign up
                  </button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <button className="px-5 py-2 rounded-xl bg-black text-white">
                  Dashboard
                </button>
              </Link>
            )}

          </div>
        </div>
      </nav>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}
<div
  className={`fixed left-0 top-[78px] w-[240px] bg-white/80 backdrop-blur-xl border border-gray-200/60 z-50 shadow-2xl rounded-2xl transition-all duration-300 ${
    open
      ? "opacity-100 translate-y-0"
      : "opacity-0 -translate-y-2 pointer-events-none"
  }`}
>
  <div className="p-5">

    {/* HEADER COM LOGO */}
    <div className="flex items-center justify-between mb-6">

    </div>

    {/* LINKS */}
    <div className="flex flex-col gap-5 text-[17px] font-medium text-gray-800">
      {links.map((link) => {
        const isOpen = mobileOpen === link.name;

        return (
          <div key={link.name}>
            <div
              className="flex items-center justify-between cursor-pointer hover:text-green-500 transition"
              onClick={() => {
                if (link.dropdown) toggleMobileDropdown(link.name);
                else if (link.href) {
                  closeSidebar();
                  router.push(link.href);
                }
              }}
            >
              <span>{link.name}</span>

              {link.dropdown && (
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-green-500" : ""
                  }`}
                />
              )}
            </div>

            {/* DROPDOWN */}
            {link.dropdown && isOpen && (
              <div className="mt-2 ml-2 flex flex-col gap-2 text-[14px] text-gray-500">
                {link.dropdown.map((item) => (
                  <div
                    key={item}
                    onClick={() => {
                      closeSidebar();
                      router.push(formatLink(item));
                    }}
                    className="cursor-pointer hover:text-black transition"
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
</div>
    </>
  );
}