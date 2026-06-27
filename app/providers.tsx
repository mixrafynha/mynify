"use client";

import { usePathname } from "next/navigation";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppWrapper>{children}</AppWrapper>;
}

function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup");

  const isAdminPage = pathname?.startsWith("/admin");
  const isDashboard = pathname?.startsWith("/dashboard");

  const hideGlobalLayout =
    isAuthPage || isAdminPage || isDashboard;

  return (
    <>
      {!hideGlobalLayout && <Navbar />}

      <div className="w-full min-h-screen flex flex-col">
        <main
          className={`flex-1 ${
            hideGlobalLayout ? "" : "pt-[65px]"
          }`}
        >
          {children}
        </main>

        {!hideGlobalLayout && <Footer />}
      </div>
    </>
  );
}