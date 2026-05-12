import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MediaItem { url: string; type: "image" | "video" }
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  media: MediaItem[];
  categories?: { name: string; slug: string } | null;
}

interface ProductsGridProps {
  products: Product[];
}

function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.media?.find((m) => m.type === "image")?.url;
  const href = product.categories
    ? `/${product.categories.slug}/${product.slug}`
    : `/design`;

  return (
    <Card className="group overflow-hidden border-gray-100 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        {product.categories && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="text-xs font-medium bg-white/90 text-gray-700 border border-gray-100 shadow-soft backdrop-blur-sm">
              {product.categories.name}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-5">
        <h3 className="font-semibold text-gray-900 mb-1.5 text-base leading-snug">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Starting from</p>
            <p className="text-lg font-bold text-gray-900">
              ₹{Number(product.price).toFixed(2)}
            </p>
          </div>
          <Link href={href}>
            <Button size="sm" variant="outline" className="text-xs font-medium group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-200">
              Customize
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductsGrid({ products }: ProductsGridProps) {
  if (!products.length) return null;

  return (
    <section id="products" className="bg-white py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-14 max-w-lg">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">Featured Products</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Crafted for quality
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Explore our most popular printing products, each designed to deliver exceptional results.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/design">
            <Button variant="outline" size="lg" className="px-8">
              View all products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
