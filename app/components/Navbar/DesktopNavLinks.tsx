import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { LINKS } from "./navData";
import { formatLink } from "./utils";

type Props = {
  activeDropdown: string | null;
  setActiveDropdown: (value: string | null) => void;
  isOpen: (name: string) => boolean;
  toggleDropdown: (name: string) => void;
  setClickedDropdown: (value: string | null) => void;
};

export default function DesktopNavLinks({
  setActiveDropdown,
  isOpen,
  toggleDropdown,
  setClickedDropdown,
}: Props) {
  return (
    <div className="hidden lg:flex items-center gap-12 text-[16px] font-semibold text-white/80">
      {LINKS.map((link) => (
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
                    onClick={() => setClickedDropdown(null)}
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
  );
}
