import { supabase } from "@/lib/supabase";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { order_id?: string };
}) {
  const orderId = searchParams.order_id;

  if (orderId) {
    await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);
  }

  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold text-green-600">
        Payment Successful 🎉
      </h1>
      <p className="mt-2 text-gray-600">Order confirmed</p>
    </div>
  );
}