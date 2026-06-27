import Link from "next/link";

type Props = {
  authChecked: boolean;
  isAuthenticated: boolean;
  role: string | null;
};

export default function AuthActions({ authChecked, isAuthenticated, role }: Props) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {!authChecked ? (
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 rounded-xl bg-white/10 animate-pulse" />
          <div className="h-10 w-28 rounded-xl bg-purple-500/20 animate-pulse" />
        </div>
      ) : !isAuthenticated ? (
        <>
          <Link href="/login">
            <button className="px-3 py-1.5 text-[15px] sm:px-4 sm:py-2 sm:text-base border border-white/10 bg-white/[0.04] rounded-xl text-white hover:bg-purple-500/10 hover:border-purple-400/50 transition">
              Log in
            </button>
          </Link>

          <Link href="/signup">
            <button className="px-4 py-1.5 text-[15px] sm:px-5 sm:py-2 sm:text-base rounded-xl text-white bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-105 transition">
              Sign up
            </button>
          </Link>
        </>
      ) : (
        <Link href={role === "admin" ? "/admin" : "/dashboard"}>
          <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-105 transition">
            Dashboard
          </button>
        </Link>
      )}
    </div>
  );
}
