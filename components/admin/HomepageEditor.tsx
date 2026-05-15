"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface MediaItem { url: string; type: string }
interface Product { id: string; name: string; price: number; media: MediaItem[] }
interface Review { id: string; name: string; text: string; rating: number }
interface FooterLink { label: string; href: string }
interface SocialLink { platform: string; url: string }

interface HomepageContent {
  hero_headline: string;
  hero_subheading: string;
  hero_primary_cta_text: string;
  hero_primary_cta_href: string;
  hero_secondary_cta_text: string;
  hero_secondary_cta_href: string;
  featured_product_ids: string[];
  reviews: Review[];
  footer_address: string;
  footer_email: string;
  footer_phone: string;
  footer_links: FooterLink[];
  footer_social: SocialLink[];
}

const DEFAULTS: HomepageContent = {
  hero_headline: "Premium Printing,\nDelivered.",
  hero_subheading: "Professional quality prints shipped directly to your door.",
  hero_primary_cta_text: "Start Designing",
  hero_primary_cta_href: "/design",
  hero_secondary_cta_text: "View Products",
  hero_secondary_cta_href: "#products",
  featured_product_ids: [],
  reviews: [
    { id: "1", name: "Sarah M.", text: "The print quality is absolutely outstanding!", rating: 5 },
    { id: "2", name: "James K.", text: "Fast delivery and pristine packaging.", rating: 5 },
    { id: "3", name: "Priya R.", text: "Couldn't be happier with the quality.", rating: 5 },
  ],
  footer_address: "123 Print Street, Design City, CA 94102",
  footer_email: "hello@shiptoprit.com",
  footer_phone: "+1 (555) 123-4567",
  footer_links: [
    { label: "Products", href: "#products" },
    { label: "Design Studio", href: "/design" },
    { label: "About Us", href: "#" },
  ],
  footer_social: [
    { platform: "instagram", url: "#" },
    { platform: "twitter", url: "#" },
    { platform: "linkedin", url: "#" },
  ],
};

type Tab = "hero" | "products" | "reviews" | "footer";

const TABS: { id: Tab; label: string }[] = [
  { id: "hero", label: "Hero" },
  { id: "products", label: "Featured Products" },
  { id: "reviews", label: "Reviews" },
  { id: "footer", label: "Footer" },
];

export default function HomepageEditor({
  initialContent,
  products,
}: {
  initialContent: Partial<HomepageContent> | null;
  products: Product[];
}) {
  const [tab, setTab] = useState<Tab>("hero");
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<HomepageContent>({
    ...DEFAULTS,
    ...initialContent,
    featured_product_ids: initialContent?.featured_product_ids ?? [],
    reviews: initialContent?.reviews ?? DEFAULTS.reviews,
    footer_links: initialContent?.footer_links ?? DEFAULTS.footer_links,
    footer_social: initialContent?.footer_social ?? DEFAULTS.footer_social,
  });

  // Review editor state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({ name: "", text: "", rating: 5 });
  const [showAddReview, setShowAddReview] = useState(false);

  const set = useCallback((key: keyof HomepageContent, value: HomepageContent[keyof HomepageContent]) => {
    setData((d) => ({ ...d, [key]: value }));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        hero: {
          headline: data.hero_headline,
          subheading: data.hero_subheading,
          primary_cta: { text: data.hero_primary_cta_text, href: data.hero_primary_cta_href },
          secondary_cta: { text: data.hero_secondary_cta_text, href: data.hero_secondary_cta_href },
        },
        featured_product_ids: data.featured_product_ids,
        reviews: data.reviews,
        footer: {
          address: data.footer_address,
          email: data.footer_email,
          phone: data.footer_phone,
          links: data.footer_links,
          social: data.footer_social,
        },
      };

      const res = await fetch("/api/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to save homepage content");
      } else {
        toast.success("Homepage content saved");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  function toggleProduct(id: string) {
    const ids = data.featured_product_ids;
    if (ids.includes(id)) {
      set("featured_product_ids", ids.filter((x) => x !== id));
    } else if (ids.length < 3) {
      set("featured_product_ids", [...ids, id]);
    }
  }

  function addReview() {
    if (!newReview.name.trim() || !newReview.text.trim()) return;
    const review: Review = {
      id: Date.now().toString(),
      name: newReview.name.trim(),
      text: newReview.text.trim(),
      rating: newReview.rating,
    };
    set("reviews", [...data.reviews, review]);
    setNewReview({ name: "", text: "", rating: 5 });
    setShowAddReview(false);
  }

  function deleteReview(id: string) {
    set("reviews", data.reviews.filter((r) => r.id !== id));
  }

  function updateReview(id: string, field: keyof Review, value: string | number) {
    set("reviews", data.reviews.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }

  function addFooterLink() {
    set("footer_links", [...data.footer_links, { label: "", href: "" }]);
  }

  function updateFooterLink(i: number, field: keyof FooterLink, value: string) {
    const links = [...data.footer_links];
    links[i] = { ...links[i], [field]: value };
    set("footer_links", links);
  }

  function removeFooterLink(i: number) {
    set("footer_links", data.footer_links.filter((_, idx) => idx !== i));
  }

  function updateSocial(i: number, field: keyof SocialLink, value: string) {
    const social = [...data.footer_social];
    social[i] = { ...social[i], [field]: value };
    set("footer_social", social);
  }

  function addSocial() {
    set("footer_social", [...data.footer_social, { platform: "", url: "" }]);
  }

  function removeSocial(i: number) {
    set("footer_social", data.footer_social.filter((_, idx) => idx !== i));
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Homepage Content</h1>
          <p className="text-sm text-gray-500 mt-1">Edit content displayed on the public homepage</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="min-w-[90px]">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
              tab === t.id
                ? "bg-white text-gray-900 shadow-soft"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Hero Tab */}
      {tab === "hero" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hero Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Headline</Label>
                <Textarea
                  value={data.hero_headline}
                  onChange={(e) => set("hero_headline", e.target.value)}
                  placeholder="Premium Printing,\nDelivered."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-gray-400">Use \n for line breaks</p>
              </div>
              <div className="space-y-1.5">
                <Label>Subheading</Label>
                <Textarea
                  value={data.hero_subheading}
                  onChange={(e) => set("hero_subheading", e.target.value)}
                  placeholder="Professional quality prints…"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">CTA Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Primary Button</p>
                <div className="space-y-1.5">
                  <Label>Button text</Label>
                  <Input
                    value={data.hero_primary_cta_text}
                    onChange={(e) => set("hero_primary_cta_text", e.target.value)}
                    placeholder="Start Designing"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Link URL</Label>
                  <Input
                    value={data.hero_primary_cta_href}
                    onChange={(e) => set("hero_primary_cta_href", e.target.value)}
                    placeholder="/design"
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Secondary Button</p>
                <div className="space-y-1.5">
                  <Label>Button text</Label>
                  <Input
                    value={data.hero_secondary_cta_text}
                    onChange={(e) => set("hero_secondary_cta_text", e.target.value)}
                    placeholder="View Products"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Link URL</Label>
                  <Input
                    value={data.hero_secondary_cta_href}
                    onChange={(e) => set("hero_secondary_cta_href", e.target.value)}
                    placeholder="#products"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Featured Products Tab */}
      {tab === "products" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Featured Products</CardTitle>
              <Badge variant={data.featured_product_ids.length === 3 ? "default" : "secondary"}>
                {data.featured_product_ids.length} / 3 selected
              </Badge>
            </div>
            <p className="text-sm text-gray-500">Select exactly 3 products to feature on the homepage.</p>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                No products yet. <a href="/admin/products" className="underline">Add products first.</a>
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((p) => {
                  const selected = data.featured_product_ids.includes(p.id);
                  const disabled = !selected && data.featured_product_ids.length >= 3;
                  const img = p.media?.find((m) => m.type === "image")?.url;

                  return (
                    <button
                      key={p.id}
                      onClick={() => !disabled && toggleProduct(p.id)}
                      disabled={disabled}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150",
                        selected
                          ? "border-black bg-black/[0.03] ring-1 ring-black"
                          : disabled
                          ? "border-gray-100 opacity-40 cursor-not-allowed"
                          : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">₹{Number(p.price).toFixed(2)}</p>
                      </div>
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                        selected ? "border-black bg-black" : "border-gray-300"
                      )}>
                        {selected && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews Tab */}
      {tab === "reviews" && (
        <div className="space-y-4">
          {data.reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    {editingReviewId === review.id ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Customer name</Label>
                            <Input
                              value={review.name}
                              onChange={(e) => updateReview(review.id, "name", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Star rating</Label>
                            <select
                              value={review.rating}
                              onChange={(e) => updateReview(review.id, "rating", Number(e.target.value))}
                              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Review text</Label>
                          <Textarea
                            value={review.text}
                            onChange={(e) => updateReview(review.id, "text", e.target.value)}
                          />
                        </div>
                        <Button size="sm" onClick={() => setEditingReviewId(null)}>Done</Button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900">{review.name}</span>
                          <span className="text-xs text-amber-500">{"★".repeat(review.rating)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{review.text}</p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {editingReviewId !== review.id && (
                      <button
                        onClick={() => setEditingReviewId(review.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="3,6 5,6 21,6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add review */}
          {showAddReview ? (
            <Card className="border-dashed border-gray-200">
              <CardContent className="pt-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Customer name</Label>
                    <Input
                      value={newReview.name}
                      onChange={(e) => setNewReview((r) => ({ ...r, name: e.target.value }))}
                      placeholder="Jane D."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Star rating</Label>
                    <select
                      value={newReview.rating}
                      onChange={(e) => setNewReview((r) => ({ ...r, rating: Number(e.target.value) }))}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Review text</Label>
                  <Textarea
                    value={newReview.text}
                    onChange={(e) => setNewReview((r) => ({ ...r, text: e.target.value }))}
                    placeholder="Share the customer's experience…"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addReview}>Add review</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddReview(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <button
              onClick={() => setShowAddReview(true)}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-all duration-150 font-medium"
            >
              + Add review
            </button>
          )}
        </div>
      )}

      {/* Footer Tab */}
      {tab === "footer" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Textarea
                  value={data.footer_address}
                  onChange={(e) => set("footer_address", e.target.value)}
                  placeholder="123 Print Street, City, State ZIP"
                  className="min-h-[70px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={data.footer_email}
                  onChange={(e) => set("footer_email", e.target.value)}
                  placeholder="hello@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={data.footer_phone}
                  onChange={(e) => set("footer_phone", e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Quick Links</CardTitle>
                  <Button size="sm" variant="ghost" onClick={addFooterLink} className="text-xs">+ Add link</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.footer_links.map((link, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={link.label}
                      onChange={(e) => updateFooterLink(i, "label", e.target.value)}
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Input
                      value={link.href}
                      onChange={(e) => updateFooterLink(i, "href", e.target.value)}
                      placeholder="URL"
                      className="flex-1"
                    />
                    <button
                      onClick={() => removeFooterLink(i)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Social Links</CardTitle>
                  <Button size="sm" variant="ghost" onClick={addSocial} className="text-xs">+ Add</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.footer_social.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={s.platform}
                      onChange={(e) => updateSocial(i, "platform", e.target.value)}
                      placeholder="instagram"
                      className="w-32 flex-shrink-0"
                    />
                    <Input
                      value={s.url}
                      onChange={(e) => updateSocial(i, "url", e.target.value)}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <button
                      onClick={() => removeSocial(i)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
