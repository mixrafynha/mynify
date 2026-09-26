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
      <nav className="sticky top-0 z-50 w-full overflow-visible border-b border-white/15 bg-[#1d1726]/95 backdrop-blur-xl">
        <div className="relative hidden min-h-[64px] w-full items-center gap-6 px-6 py-2 lg:flex xl:px-10">
          <div className="shrink-0">
            <NavbarBrand />
          </div>

          <DesktopNavLinks
            activeDropdown={activeDropdown}
            setActiveDropdown={setActiveDropdown}
            isOpen={isOpen}
            toggleDropdown={toggleDropdown}
            setClickedDropdown={setClickedDropdown}
          />

          <div className="ml-auto shrink-0">
            <AuthActions
              authChecked={authChecked}
              isAuthenticated={isAuthenticated}
              role={role}
            />
          </div>
        </div>

        <div className="relative flex min-h-[58px] w-full items-center justify-between px-4 py-2 sm:px-6 lg:hidden">
          <div className="flex items-center gap-3">
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
          <AuthActions authChecked={authChecked} isAuthenticated={isAuthenticated} role={role} />
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
