type AdminHeaderProps = {
  notifications?: any[];
};

export default function AdminHeader({
  notifications = [],
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
  );
}