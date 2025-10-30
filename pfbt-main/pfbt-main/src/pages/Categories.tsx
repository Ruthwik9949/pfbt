import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, FolderOpen } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

const DEFAULT_CATEGORIES = ["Food", "Rent", "Salary", "Shopping", "Bills", "Travel", "Others"];

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*");

    if (error) {
      toast.error("Failed to fetch categories");
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (DEFAULT_CATEGORIES.includes(name)) {
      toast.error("This category already exists as a default category");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("categories").insert({
      name,
      user_id: user?.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Category already exists");
      } else {
        toast.error("Failed to add category");
      }
    } else {
      toast.success("Category added successfully");
      setIsDialogOpen(false);
      fetchCategories();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete category");
    } else {
      toast.success("Category deleted successfully");
      fetchCategories();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Categories</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input id="name" name="name" required />
              </div>
              <Button type="submit" className="w-full">
                Add Category
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Default Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Default Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {DEFAULT_CATEGORIES.map((category) => (
              <div
                key={category}
                className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
              >
                <FolderOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">{category}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No custom categories yet. Add your first one!
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-secondary" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Categories;