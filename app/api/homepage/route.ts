import { supabaseAdmin } from '@/lib/supabase/client';
import { getSession } from '@/lib/session';

const DEFAULT_CONTENT = {
  hero: {
    headline: "Premium Printing,\nDelivered.",
    subheading: "Professional quality prints shipped directly to your door. Fast, reliable, and beautiful.",
    primary_cta: { text: "Start Designing", href: "/design" },
    secondary_cta: { text: "View Products", href: "#products" },
  },
  featured_product_ids: [] as string[],
  reviews: [
    { id: "1", name: "Sarah M.", text: "The print quality is absolutely outstanding. My custom stickers look professional and the colors are vibrant!", rating: 5 },
    { id: "2", name: "James K.", text: "Fast delivery and the packaging was pristine. Exactly what I ordered, no surprises.", rating: 5 },
    { id: "3", name: "Priya R.", text: "Used ShipToPrint for our company merchandise and couldn't be happier. Premium quality at a fair price.", rating: 5 },
  ],
  footer: {
    address: "123 Print Street, Design City, CA 94102",
    email: "hello@shiptoprit.com",
    phone: "+1 (555) 123-4567",
    links: [
      { label: "Products", href: "#products" },
      { label: "Design Studio", href: "/design" },
      { label: "About Us", href: "#" },
    ],
    social: [
      { platform: "instagram", url: "#" },
      { platform: "twitter", url: "#" },
      { platform: "linkedin", url: "#" },
    ],
  },
};

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('homepage_content')
      .select('*')
      .eq('id', 1)
      .single();

    const content = data ? {
      hero: {
        headline: data.hero_headline ?? DEFAULT_CONTENT.hero.headline,
        subheading: data.hero_subheading ?? DEFAULT_CONTENT.hero.subheading,
        primary_cta: {
          text: data.hero_primary_cta_text ?? DEFAULT_CONTENT.hero.primary_cta.text,
          href: data.hero_primary_cta_href ?? DEFAULT_CONTENT.hero.primary_cta.href,
        },
        secondary_cta: {
          text: data.hero_secondary_cta_text ?? DEFAULT_CONTENT.hero.secondary_cta.text,
          href: data.hero_secondary_cta_href ?? DEFAULT_CONTENT.hero.secondary_cta.href,
        },
      },
      featured_product_ids: data.featured_product_ids ?? [],
      reviews: data.reviews ?? DEFAULT_CONTENT.reviews,
      footer: {
        address: data.footer_address ?? DEFAULT_CONTENT.footer.address,
        email: data.footer_email ?? DEFAULT_CONTENT.footer.email,
        phone: data.footer_phone ?? DEFAULT_CONTENT.footer.phone,
        links: data.footer_links ?? DEFAULT_CONTENT.footer.links,
        social: data.footer_social ?? DEFAULT_CONTENT.footer.social,
      },
    } : DEFAULT_CONTENT;

    const featuredIds: string[] = content.featured_product_ids;
    let featuredProducts = [];

    if (featuredIds.length > 0) {
      const { data: prods } = await supabaseAdmin
        .from('products')
        .select('*, categories(name, slug)')
        .in('id', featuredIds)
        .limit(3);
      featuredProducts = prods ?? [];
    } else {
      const { data: prods } = await supabaseAdmin
        .from('products')
        .select('*, categories(name, slug)')
        .order('created_at', { ascending: false })
        .limit(3);
      featuredProducts = prods ?? [];
    }

    return Response.json({ content, featured_products: featuredProducts });
  } catch {
    return Response.json({ content: DEFAULT_CONTENT, featured_products: [] });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.hero) {
    if (body.hero.headline     !== undefined) update.hero_headline          = body.hero.headline;
    if (body.hero.subheading   !== undefined) update.hero_subheading        = body.hero.subheading;
    if (body.hero.primary_cta?.text  !== undefined) update.hero_primary_cta_text  = body.hero.primary_cta.text;
    if (body.hero.primary_cta?.href  !== undefined) update.hero_primary_cta_href  = body.hero.primary_cta.href;
    if (body.hero.secondary_cta?.text !== undefined) update.hero_secondary_cta_text = body.hero.secondary_cta.text;
    if (body.hero.secondary_cta?.href !== undefined) update.hero_secondary_cta_href = body.hero.secondary_cta.href;
  }
  if (body.featured_product_ids !== undefined) update.featured_product_ids = body.featured_product_ids;
  if (body.reviews              !== undefined) update.reviews               = body.reviews;
  if (body.footer) {
    if (body.footer.address !== undefined) update.footer_address = body.footer.address;
    if (body.footer.email   !== undefined) update.footer_email   = body.footer.email;
    if (body.footer.phone   !== undefined) update.footer_phone   = body.footer.phone;
    if (body.footer.links   !== undefined) update.footer_links   = body.footer.links;
    if (body.footer.social  !== undefined) update.footer_social  = body.footer.social;
  }

  const { error } = await supabaseAdmin
    .from('homepage_content')
    .upsert({ id: 1, ...update });

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
