import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeroProps {
  headline: string;
  subheading: string;
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
}

export default function HeroSection({ headline, subheading, primaryCta, secondaryCta }: HeroProps) {
  const lines = headline.split("\n");

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Subtle decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(240,240,240,0.6),transparent)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(245,245,245,0.8),transparent_70%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-28 md:pt-32 md:pb-36">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 border border-gray-200 rounded-full px-3.5 py-1.5 text-xs text-gray-500 mb-10 bg-white shadow-soft">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Professional printing, fast delivery
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-[-0.03em] leading-[1.04] mb-7 text-gray-900 max-w-3xl">
          {lines.map((line, i) => (
            <span key={i} className={i === lines.length - 1 ? "text-black" : ""}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </h1>

        <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-10 max-w-xl">
          {subheading}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={primaryCta.href}>
            <Button size="lg" className="w-full sm:w-auto px-8 shadow-md hover:shadow-lg transition-shadow duration-200">
              {primaryCta.text}
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </Link>
          <Link href={secondaryCta.href}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
              {secondaryCta.text}
            </Button>
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-6 mt-14 text-xs text-gray-400">
          {["Free shipping on orders $50+", "Premium quality guaranteed", "5-day turnaround"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
              </svg>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
