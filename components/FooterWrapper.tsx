import SiteFooter from "@/components/SiteFooter";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const DEFAULTS = {
  address: "123 Print Street, Design City, CA 94102",
  email:   "hello@shiptoprit.com",
  phone:   "+1 (555) 123-4567",
  links:   [{ label: "Products", href: "#products" }, { label: "Design Studio", href: "/design" }, { label: "About Us", href: "#" }],
  social:  [{ platform: "instagram", url: "#" }, { platform: "twitter", url: "#" }, { platform: "linkedin", url: "#" }],
};

export default async function FooterWrapper() {
  let footer = DEFAULTS;
  try {
    const res = await fetch(`${BASE}/api/homepage`, { cache: "no-store" });
    if (res.ok) {
      const { content } = await res.json();
      if (content?.footer) footer = { ...DEFAULTS, ...content.footer };
    }
  } catch {
    // use defaults
  }
  return (
    <SiteFooter
      address={footer.address}
      email={footer.email}
      phone={footer.phone}
      links={footer.links}
      social={footer.social}
    />
  );
}
