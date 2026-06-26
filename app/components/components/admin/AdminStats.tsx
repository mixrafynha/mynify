import { Users, Package, Euro } from "lucide-react";

function Card({ icon, label, value }: any) {
  return (
    <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-white/5 text-white/70">
          {icon}
        </div>

        <div>
          <p className="text-[11px] text-white/40">{label}</p>
          <p className="text-sm font-semibold text-white/90">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminStats({ users, products, revenue }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

      <Card
        icon={<Users size={15} />}
        label="Users"
        value={users?.length ?? 0}
      />

      <Card
        icon={<Package size={15} />}
        label="Products"
        value={products?.length ?? 0}
      />

      <Card
        icon={<Euro size={15} />}
        label="Revenue"
        value={`€${revenue ?? 0}`}
      />

    </div>
  );
}