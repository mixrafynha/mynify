import Link from "next/link";
import { LINKS } from "./navData";

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
  const linkClass = "px-1 py-2 text-white transition duration-300 hover:-translate-y-0.5 hover:text-purple-300";

  return (
    <div className="hidden flex-1 items-center justify-center gap-8 text-[17px] font-semibold tracking-[-0.01em] text-white lg:flex xl:gap-12 xl:text-[18px]">
      {LINKS.map((link) => (
        <div
          key={link.name}
          className="relative"
          onMouseEnter={() => setActiveDropdown(link.name)}
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <div className="flex items-center gap-1 cursor-pointer group">
            <Link href={link.href} className={linkClass}>{link.name}</Link>

          </div>
        </div>
      ))}
    </div>
  );
}
