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
  { name: "Support", dropdown: ["Contact"] },
]);

/* 🔐 SAFE SLUG GENERATOR (fixed XSS risk) */
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

  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [role, setRole] = useState<string | null>(null);
    
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
    
        if (!res.ok) {
          setIsAuthenticated(false);
          setRole(null);
          return;
        }
    
        const data = await res.json();
    
        setIsAuthenticated(true);
        setRole(data?.user?.role ?? data?.role ?? null);
      } catch {
        setIsAuthenticated(false);
        setRole(null);
      } finally {
        setAuthChecked(true);
      }
    };

  const isOpen = useCallback(
    (name: string) => clickedDropdown === name || activeDropdown === name,
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
        <nav className="sticky top-0 z-50 w-full border-b border-purple-500/20 bg-[#05050b]/90 backdrop-blur-xl shadow-[0_0_45px_rgba(168,85,247,0.15)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={toggleSidebar}
              className="lg:hidden text-2xl text-white hover:text-purple-400 transition"
            >
              ☰
            </button>
      
            <Link href="/" className="group overflow-visible select-none shrink-0 ml-3">
              <img
                src="/Logo.png"
                alt="Mynify Logo"
                draggable="false"
                className="w-10 h-10 object-contain scale-[3.5] md:scale-[4.5] translate-y-2 origin-center pointer-events-none drop-shadow-[0_0_30px_rgba(168,85,247,1)] transition duration-300"
              />
            </Link>
          </div>
      
          {/* DESKTOP */}
          <div className="hidden lg:flex items-center gap-12 text-[16px] font-semibold text-white/80">
            {links.map((link) => (
              <div
                key={link.name}
                className="relative"
                onMouseEnter={() => setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="flex items-center gap-1 cursor-pointer group">
                  {!link.dropdown ? (
                    <Link href={link.href ?? "/"} className="hover:text-purple-400 transition">
                      {link.name}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleDropdown(link.name)}
                      className="hover:text-purple-400 transition"
                    >
                      {link.name}
                    </button>
                  )}
      
                  {link.dropdown && (
                    <ChevronDown
                      size={16}
                      className={`transition ${
                        isOpen(link.name) ? "rotate-180 text-purple-400" : "text-white/70"
                      }`}
                    />
                  )}
                </div>
      
                {link.dropdown && (
                  <div
                    className={`absolute top-full left-0 pt-4 transition ${
                      isOpen(link.name) ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="bg-[#0b0b16]/95 shadow-2xl rounded-2xl p-3 min-w-[220px] border border-purple-500/20 backdrop-blur-xl">
                      {link.dropdown.map((item) => (
                        <Link
                          key={item}
                          href={formatLink(item)}
                          className="block px-4 py-2 text-sm text-white/75 hover:text-white hover:bg-purple-500/15 rounded-lg transition"
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
              <button className="px-4 py-2 border border-purple-500/40 rounded-xl text-white hover:bg-purple-500/10 hover:border-purple-400 transition">
                Log in
              </button>
            </Link>
  
            <Link href="/signup">
              <button className="px-5 py-2 rounded-xl text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-[0_0_25px_rgba(168,85,247,0.55)] hover:scale-105 transition">
                Sign up
              </button>
            </Link>
          </>
        ) : (
         <Link href={role === "admin" ? "/admin" : "/dashboard"}>
            <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.55)] hover:scale-105 transition">
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
          className="fixed inset-0 bg-black/70 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`fixed left-0 top-[78px] w-[240px] bg-[#090912]/95 backdrop-blur-xl border border-purple-500/20 z-50 shadow-[0_0_35px_rgba(168,85,247,0.25)] rounded-2xl transition-all duration-300 ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="p-5">
          {/* HEADER COM LOGO */}
          <div className="flex items-center justify-between mb-6"></div>

          {/* LINKS */}
          <div className="flex flex-col gap-5 text-[17px] font-semibold text-white/80">
            {links.map((link) => {
              const isOpen = mobileOpen === link.name;

              return (
                <div key={link.name}>
                  <div
                    className="flex items-center justify-between cursor-pointer hover:text-purple-400 transition"
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
                          isOpen
                            ? "rotate-180 text-purple-400"
                            : "text-white/60"
                        }`}
                      />
                    )}
                  </div>

                  {/* DROPDOWN */}
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
