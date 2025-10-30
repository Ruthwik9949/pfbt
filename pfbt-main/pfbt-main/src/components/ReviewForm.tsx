import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  onReviewAdded: () => void;
}

const ReviewForm = ({ onReviewAdded }: ReviewFormProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a review",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        name,
        role,
        rating,
        review_text: reviewText,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your review has been submitted!",
      });

      // Reset form
      setName("");
      setRole("");
      setRating(5);
      setReviewText("");
      onReviewAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg bg-card">
      <h3 className="text-xl font-semibold">Share Your Experience</h3>
      
      <div>
        <Label htmlFor="name">Your Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="John Doe"
        />
      </div>

      <div>
        <Label htmlFor="role">Your Role/Profession</Label>
        <Input
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          placeholder="e.g., Freelancer, Teacher, etc."
        />
      </div>

      <div>
        <Label>Rating</Label>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= rating
                    ? "fill-warning text-warning"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="review">Your Review</Label>
        <Textarea
          id="review"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          required
          placeholder="Share your thoughts about the app..."
          rows={4}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
};

export default ReviewForm;
