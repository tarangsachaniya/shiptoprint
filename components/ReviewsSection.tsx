import { Card, CardContent } from "@/components/ui/card";

interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i <= rating ? "text-amber-400" : "text-gray-200"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const initials = review.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="border-gray-100 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 h-full flex flex-col">
      <CardContent className="p-6 flex flex-col flex-1">
        {/* Stars */}
        <StarRating rating={review.rating} />

        {/* Quote */}
        <blockquote className="mt-4 mb-6 text-gray-700 text-sm leading-relaxed flex-1">
          &ldquo;{review.text}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
          <div className="w-9 h-9 rounded-full bg-gray-900 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{review.name}</p>
            <p className="text-xs text-gray-400">Verified customer</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;

  return (
    <section className="bg-gray-50/60 py-24 md:py-32 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
            Customer Reviews
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Loved by creators
          </h2>
          <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
            Join thousands of happy customers who trust ShipToPrint for their printing needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 5).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
