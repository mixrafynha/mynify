import type { ReactNode } from "react";

export const metadata = {
  title: "Checkout | Ryfio",
  description: "Secure checkout for your Ryfio order.",
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body:has([data-ryfio-checkout-page]) > header,
            body:has([data-ryfio-checkout-page]) > nav,
            body:has([data-ryfio-checkout-page]) > footer {
              display: none !important;
            }
          `,
        }}
      />
      {children}
    </>
  );
}
