import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, PieChart, Shield, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Session } from "@supabase/supabase-js";
import ReviewForm from "@/components/ReviewForm";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Hero Section */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-4xl text-center space-y-8">
          <div className="flex justify-center mb-6">
            <div className="bg-primary text-primary-foreground p-4 rounded-full">
              <DollarSign className="h-12 w-12" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Personal Finance
            <br />
            <span className="text-primary">Budget Tracker</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Take control of your finances with our easy-to-use budget tracker. 
            Monitor income, track expenses, and achieve your financial goals.
          </p>

          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 bg-card rounded-lg border shadow-sm">
              <TrendingUp className="h-8 w-8 text-success mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Track Income & Expenses</h3>
              <p className="text-sm text-muted-foreground">
                Easily add and categorize your transactions
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-lg border shadow-sm">
              <PieChart className="h-8 w-8 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Visual Analytics</h3>
              <p className="text-sm text-muted-foreground">
                See where your money goes with beautiful charts
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-lg border shadow-sm">
              <Shield className="h-8 w-8 text-info mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">
                Your financial data is encrypted and secure
              </p>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-20">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              What Our Users Say
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Join thousands of satisfied users who have taken control of their finances
            </p>

            {user && (
              <div className="max-w-2xl mx-auto mb-12">
                <ReviewForm onReviewAdded={fetchReviews} />
              </div>
            )}
            
            <div className="grid md:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
};

export default Index;
