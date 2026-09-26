import Link from "next/link";

type Props = {
  authChecked: boolean;
  isAuthenticated: boolean;
  role: string | null;
};

export default function AuthActions({ authChecked, isAuthenticated, role }: Props) {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      {!authChecked ? (
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 rounded-xl bg-white/10 animate-pulse" />
          <div className="h-10 w-28 rounded-xl bg-purple-500/20 animate-pulse" />
        </div>
      ) : !isAuthenticated ? (
        <>
          <Link href="/login">
            <button className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white transition duration-300 hover:-translate-y-1 hover:border-purple-400/50 hover:bg-purple-500/10 sm:px-4 sm:text-sm lg:px-6 lg:py-2 lg:text-lg">
              Log in
            </button>
          </Link>

          <Link href="/signup">
            <button className="rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-3.5 py-1.5 text-xs text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] transition duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_0_32px_rgba(168,85,247,0.55)] sm:px-4 sm:text-sm lg:px-7 lg:py-2 lg:text-lg">
              Sign up
            </button>
          </Link>
        </>
      ) : (
        <Link href={role === "admin" ? "/admin" : "/dashboard"}>
          <button className="rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-5 py-2 text-sm text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] transition duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_0_32px_rgba(168,85,247,0.55)] sm:px-4 sm:py-1.5 sm:text-sm lg:px-7 lg:py-2 lg:text-lg">
            Dashboard
          </button>
        </Link>
      )}
    </div>
  );
}
