"use client";

export default function QuickButton({
  icon,
  onClick,
}: any) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-violet-50 flex items-center justify-center transition active:scale-95"
    >
      {icon}
    </button>
  );
}