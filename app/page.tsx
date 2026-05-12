import NavWrapper from "@/components/NavWrapper";
import HeroSection from "@/components/HeroSection";
import ProductsGrid from "@/components/ProductsGrid";
import ReviewsSection from "@/components/ReviewsSection";
import SiteFooter from "@/components/SiteFooter";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const DEFAULT_HERO = {
  headline: "Premium Printing,\nDelivered.",
  subheading: "Professional quality prints shipped directly to your door. Fast, reliable, and beautiful.",
  primary_cta:   { text: "Start Designing", href: "/design" },
  secondary_cta: { text: "View Products",   href: "#products" },
};
const DEFAULT_REVIEWS = [
  { id: "1", name: "Sarah M.",  text: "The print quality is absolutely outstanding. My custom stickers look professional!", rating: 5 },
  { id: "2", name: "James K.",  text: "Fast delivery and pristine packaging. Exactly what I ordered, no surprises.",       rating: 5 },
  { id: "3", name: "Priya R.",  text: "Used ShipToPrint for our company merch and couldn't be happier.",                   rating: 5 },
];
const DEFAULT_FOOTER = {
  address: "123 Print Street, Design City, CA 94102",
  email:   "hello@shiptoprit.com",
  phone:   "+1 (555) 123-4567",
  links:   [{ label: "Products", href: "#products" }, { label: "Design Studio", href: "/design" }, { label: "About Us", href: "#" }],
  social:  [{ platform: "instagram", url: "#" }, { platform: "twitter", url: "#" }, { platform: "linkedin", url: "#" }],
};

export default async function HomePage() {
  let hero         = DEFAULT_HERO;
  let reviews      = DEFAULT_REVIEWS;
  let footer       = DEFAULT_FOOTER;
  let featured: Parameters<typeof ProductsGrid>[0]["products"] = [];

  try {
    const res = await fetch(`${BASE}/api/homepage`, { cache: "no-store" });
    if (res.ok) {
      const { content, featured_products } = await res.json();
      hero     = { ...DEFAULT_HERO,   ...content.hero };
      reviews  = content.reviews  ?? DEFAULT_REVIEWS;
      footer   = { ...DEFAULT_FOOTER, ...content.footer };
      featured = featured_products ?? [];
    }
  } catch {
    // Silently use defaults
  }

  return (
    <div className="min-h-screen bg-white">
      <NavWrapper />

      <main>
        <HeroSection
          headline={hero.headline}
          subheading={hero.subheading}
          primaryCta={hero.primary_cta}
          secondaryCta={hero.secondary_cta}
        />
        <ProductsGrid products={featured} />
        <div id="reviews">
          <ReviewsSection reviews={reviews} />
        </div>
      </main>

      <SiteFooter
        address={footer.address}
        email={footer.email}
        phone={footer.phone}
        links={footer.links}
        social={footer.social}
      />
    </div>
  );
}
