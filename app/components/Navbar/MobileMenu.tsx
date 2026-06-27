import { ChevronDown } from "lucide-react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LINKS } from "./navData";
import { formatLink } from "./utils";

type Props = {
  open: boolean;
  mobileOpen: string | null;
  toggleMobileDropdown: (name: string) => void;
  closeSidebar: () => void;
  router: AppRouterInstance;
};

export default function MobileMenu({
  open,
  mobileOpen,
  toggleMobileDropdown,
  closeSidebar,
  router,
}: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed left-0 top-[78px] w-[240px] bg-[#070711]/95 backdrop-blur-2xl border border-white/10 z-50 shadow-[0_0_45px_rgba(168,85,247,0.28)] rounded-2xl transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_40%),radial-gradient(circle_at_90%_100%,rgba(14,165,233,0.10),transparent_32%)]" />

        <div className="relative p-5">
          <div className="flex items-center justify-between mb-6"></div>

          <div className="flex flex-col gap-5 text-[17px] font-semibold text-white/80">
            {LINKS.map((link) => {
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
                          isOpen ? "rotate-180 text-purple-400" : "text-white/60"
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
