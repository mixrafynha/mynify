export default function AdminGuard({ user, role, children }: any) {
  if (!user || role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17] text-red-400">
        Access denied
      </div>
    );
  }

  return children;
}