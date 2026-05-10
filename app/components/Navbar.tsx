"use client";

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const LINKS = Object.freeze([
  { name: "Catalog", href: "/catalog" },
  { name: "How it works", dropdown: ["How Mynify works"] },
  { name: "Pricing", href: "/pricing" },
  { name: "Blog", href: "/blog" },
  { name: "Support", dropdown: ["Contact"] },
]);

const formatLink = (text: string): string => {
  if (typeof text !== "string") return "/";

  const cleaned = text
    .replace(/[<>\"'`]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  return cleaned ? `/${cleaned}` : "/";
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [clickedDropdown, setClickedDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          setIsAuthenticated(false);
          setRole(null);
          return;
        }

        const data = await res.json();

        setIsAuthenticated(true);
        setRole(data?.user?.profile?.role ?? "user");
      } catch {
        setIsAuthenticated(false);
        setRole(null);
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
    setClickedDropdown((prev) =>
      prev === name ? null : name
    );
  }, []);

  const toggleMobileDropdown = useCallback((name: string) => {
    setMobileOpen((prev) =>
      prev === name ? null : name
    );
  }, []);

  const toggleSidebar = useCallback(() => {
    setOpen((p) => !p);
  }, []);

  const closeSidebar = useCallback(() => {
    setOpen(false);
    setMobileOpen(null);
  }, []);

  const links = useMemo(() => LINKS, []);

  if (pathname === "/signup") return null;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full overflow-visible border-b border-white/10 bg-[#03030a]/90 backdrop-blur-2xl shadow-[0_0_55px_rgba(168,85,247,0.18)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_85%_0%,rgba(14,165,233,0.12),transparent_24%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={toggleSidebar}
              className="lg:hidden text-2xl text-white hover:text-purple-400 transition"
            >
              ☰
            </button>
              <Link
  href="/"
  className="group overflow-visible select-none shrink-0 ml-3"
>
  <div className="relative flex items-center">
    <span
      className="
        text-3xl
        md:text-4xl
        font-black
        tracking-[-0.06em]
        text-white
        transition-all
        duration-300
        group-hover:scale-[1.03]
      "
      style={{
        fontFamily:
          "'Clash Display', 'Space Grotesk', sans-serif",
      }}
    >
      <span
        className="
          inline-block
          bg-gradient-to-br
          from-fuchsia-400
          via-purple-500
          to-cyan-400
          bg-clip-text
          text-transparent
          drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]
        "
      >
        M
      </span>
      <span className="text-white">
        ynify
      </span>
    </span>

    <div className="absolute -inset-3 bg-purple-500/10 blur-2xl rounded-full opacity-70 pointer-events-none" />
  </div>
</Link>
            

          
        </div>

          <div className="hidden lg:flex items-center gap-12 text-[16px] font-semibold text-white/80">
            {links.map((link) => (
              <div
                key={link.name}
                className="relative"
                onMouseEnter={() =>
                  setActiveDropdown(link.name)
                }
                onMouseLeave={() =>
                  setActiveDropdown(null)
                }
              >
                <div className="flex items-center gap-1 cursor-pointer group">
                  {!link.dropdown ? (
                    <Link
                      href={link.href ?? "/"}
                      className="hover:text-purple-400 transition"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        toggleDropdown(link.name)
                      }
                      className="hover:text-purple-400 transition"
                    >
                      {link.name}
                    </button>
                  )}

                  {link.dropdown && (
                    <ChevronDown
                      size={16}
                      className={`transition ${
                        isOpen(link.name)
                          ? "rotate-180 text-purple-400"
                          : "text-white/70"
                      }`}
                    />
                  )}
                </div>

                {link.dropdown && (
                  <div
                    className={`absolute left-0 top-full z-[999] pt-4 transition duration-200 ${
                      isOpen(link.name)
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-1 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="bg-[#070711]/95 shadow-[0_0_45px_rgba(168,85,247,0.22)] rounded-2xl p-3 min-w-[220px] border border-white/10 backdrop-blur-2xl">
                      {link.dropdown.map((item) => (
                        <Link
                          key={item}
                          href={formatLink(item)}
                          className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-purple-500/15 rounded-lg transition"
                          onClick={() =>
                            setClickedDropdown(null)
                          }
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

          <div className="flex items-center gap-2 sm:gap-3">
            {!authChecked ? (
              <div className="flex items-center gap-2">
                <div className="h-10 w-24 rounded-xl bg-white/10 animate-pulse" />
                <div className="h-10 w-28 rounded-xl bg-purple-500/20 animate-pulse" />
              </div>
            ) : !isAuthenticated ? (
              <>
                <Link href="/login">
                  <button className="px-4 py-2 border border-white/10 bg-white/[0.04] rounded-xl text-white hover:bg-purple-500/10 hover:border-purple-400/50 transition">
                    Log in
                  </button>
                </Link>

                <Link href="/signup">
                  <button className="px-5 py-2 rounded-xl text-white bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-105 transition">
                    Sign up
                  </button>
                </Link>
              </>
            ) : (
              <Link
                href={
                  role === "admin"
                    ? "/admin"
                    : "/dashboard"
                }
              >
                <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-105 transition">
                  Dashboard
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed left-0 top-[78px] w-[240px] bg-[#070711]/95 backdrop-blur-2xl border border-white/10 z-50 shadow-[0_0_45px_rgba(168,85,247,0.28)] rounded-2xl transition-all duration-300 ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_40%),radial-gradient(circle_at_90%_100%,rgba(14,165,233,0.10),transparent_32%)]" />

        <div className="relative p-5">
          <div className="flex items-center justify-between mb-6"></div>

          <div className="flex flex-col gap-5 text-[17px] font-semibold text-white/80">
            {links.map((link) => {
              const isOpen = mobileOpen === link.name;

              return (
                <div key={link.name}>
                  <div
                    className="flex items-center justify-between cursor-pointer hover:text-purple-400 transition"
                    onClick={() => {
                      if (link.dropdown) {
                        toggleMobileDropdown(link.name);
                      } else if (link.href) {
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
                          isOpen
                            ? "rotate-180 text-purple-400"
                            : "text-white/60"
                        }`}
                      />
                    )}
                  </div>

                  {link.dropdown && isOpen && (
                    <div className="mt-2 ml-2 flex flex-col gap-2 text-[14px] text-white/50">
                      {link.dropdown.map((item) => (
                        <div
                          key={item}
                          onClick={() => {
                            closeSidebar();
                            router.push(formatLink(item));
                          }}
                          className="cursor-pointer hover:text-purple-300 transition"
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
