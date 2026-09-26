"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const TESTIMONIALS = [
  { name: "Alex", avatar: "12", text: "I had an idea for a small clothing drop and turned it into a proper product in one evening." },
  { name: "Sofia", avatar: "47", text: "I am not a designer, but the AI helped me create something I was proud to share." },
  { name: "Marcus", avatar: "56", text: "The preview made it easy to see my idea as a real product before ordering." },
  { name: "Mia", avatar: "32", text: "It gave me the confidence to launch my first collection without buying stock." },
];

export default function TestimonialRotator() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % TESTIMONIALS.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  const testimonial = TESTIMONIALS[active];

  return (
    <div className="testimonial-window h-[132px] text-base font-semibold leading-7 text-white/80" aria-live="polite">
      <div key={testimonial.name} className="testimonial-message">
        <div className="flex items-center gap-3">
          <Image src={`https://i.pravatar.cc/96?img=${testimonial.avatar}`} alt={testimonial.name} width={42} height={42} unoptimized className="rounded-full object-cover ring-2 ring-fuchsia-400/50" />
          <b className="text-base text-white">{testimonial.name}</b>
          <i className="not-italic text-amber-300">★★★★★</i>
        </div>
        <em className="mt-3 block not-italic">“{testimonial.text}”</em>
      </div>
    </div>
  );
}
