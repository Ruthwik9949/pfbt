import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReviewForm from "@/components/ReviewForm";

const Reviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            User Reviews
          </h1>
          <p className="text-muted-foreground">
            Share your experience and see what others are saying
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <ReviewForm onReviewAdded={fetchReviews} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id} className="border shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {review.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{review.name}</p>
                      <p className="text-sm text-muted-foreground">{review.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "{review.review_text}"
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center text-muted-foreground py-8">
              No reviews yet. Be the first to share your experience!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
