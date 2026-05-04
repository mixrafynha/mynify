type AdminHeaderProps = {
  notifications?: any[];
};

type AdminHeaderProps = {
  notifications?: any[];
  title?: string;
};

export default function AdminHeader({
  notifications = [],
<<<<<<< HEAD
}: AdminHeaderProps) {
  return (
    <div className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0b0f17]">
      
      <h1 className="text-white font-semibold text-lg">
        Admin Panel
      </h1>

      {/* 🔔 Notifications */}
      <div className="flex items-center gap-2">
        <span className="text-white/50 text-sm">
          Notifications
        </span>

        <div className="bg-white/10 px-3 py-1 rounded-full text-xs">
          {notifications.length}
        </div>
      </div>
    </div>
=======
  title = "Admin Dashboard",
}: AdminHeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 h-14 flex items-center justify-between
      px-4 sm:px-6
      bg-[#0b0f17]/70 backdrop-blur-xl
      border-b border-white/10"
    >
      <div className="flex flex-col leading-tight">
        <h1 className="text-sm font-semibold text-white/90">{title}</h1>

        <p className="text-[11px] text-white/40 hidden sm:block">
          Manage your products, users and analytics
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hover:scale-105 transition">
          <NotificationBell notifications={notifications} />
        </div>

        <div className="hover:scale-105 transition">
          <SmartCreateButton />
        </div>
      </div>
    </header>
>>>>>>> 3df94af36dadd9a8d3ed1ab1e713db0d4d0b81c5
  );
}
