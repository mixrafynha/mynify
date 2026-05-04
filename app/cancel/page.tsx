import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        
        {/* ICON */}
        <div className="text-red-500 text-6xl mb-4">✕</div>

        {/* TITLE */}
        <h1 className="text-2xl font-bold text-gray-900">
          Payment Cancelled
        </h1>

        {/* TEXT */}
        <p className="text-gray-600 mt-3">
          Your payment was cancelled. No charge was made.
        </p>

        {/* BUTTONS */}
        <div className="mt-6 flex flex-col gap-3">
          
          <Link
            href="/dashboard"
            className="bg-black text-white py-3 rounded-xl hover:opacity-90 transition"
          >
            Go back to dashboard
          </Link>

          <Link
            href="/"
            className="text-gray-500 hover:text-black text-sm"
          >
            Continue shopping
          </Link>

        </div>

      </div>
    </div>
  );
}