export default function SidebarHeader({ expanded }: any) {
  return (
    <div className="pt-6 pb-6 flex justify-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {expanded ? (
          <span className="flex items-center">
            MY<span className="text-green-500 font-bold">NIFY</span>
          </span>
        ) : (
          <span className="text-green-500 font-bold">M</span>
        )}
      </h1>
    </div>
  );
}