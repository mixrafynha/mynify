"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import NavbarBrand from "./NavbarBrand";
import DesktopNavLinks from "./DesktopNavLinks";
import AuthActions from "./AuthActions";
import MobileMenu from "./MobileMenu";

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

        if (!data?.user) {
          setIsAuthenticated(false);
          setRole(null);
          return;
        }

        setIsAuthenticated(true);
        setRole(data.user.profile?.role ?? "user");
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

  useEffect(() => {
    if (!open) return;

    const closeOnScroll = () => {
      setOpen(false);
      setMobileOpen(null);
    };

    window.addEventListener("scroll", closeOnScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", closeOnScroll);
    };
  }, [open]);

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

  if (pathname === "/signup") return null;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full overflow-visible bg-[#03030a]/90 backdrop-blur-2xl">
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

            <NavbarBrand />
          </div>

          <DesktopNavLinks
            activeDropdown={activeDropdown}
            setActiveDropdown={setActiveDropdown}
            isOpen={isOpen}
            toggleDropdown={toggleDropdown}
            setClickedDropdown={setClickedDropdown}
          />

          <AuthActions
            authChecked={authChecked}
            isAuthenticated={isAuthenticated}
            role={role}
          />
        </div>
      </nav>

      <MobileMenu
        open={open}
        mobileOpen={mobileOpen}
        toggleMobileDropdown={toggleMobileDropdown}
        closeSidebar={closeSidebar}
        router={router}
      />
    </>
  );
}
