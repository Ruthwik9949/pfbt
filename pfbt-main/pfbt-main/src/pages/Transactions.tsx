import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Filter } from "lucide-react";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  date: string;
  description?: string;
}

const DEFAULT_CATEGORIES = ["Food", "Rent", "Salary", "Shopping", "Bills", "Travel", "Others"];

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch transactions");
    } else {
      setTransactions((data || []) as Transaction[]);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("name");
    if (data && data.length > 0) {
      const customCategories = data.map((c) => c.name);
      setCategories([...DEFAULT_CATEGORIES, ...customCategories]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const transactionData = {
      title: formData.get("title") as string,
      amount: parseFloat(formData.get("amount") as string),
      category: formData.get("category") as string,
      type: formData.get("type") as "income" | "expense",
      date: formData.get("date") as string,
      description: formData.get("description") as string || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("transactions")
        .update(transactionData)
        .eq("id", editingId);

      if (error) {
        toast.error("Failed to update transaction");
      } else {
        toast.success("Transaction updated successfully");
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("transactions").insert({
        ...transactionData,
        user_id: user?.id,
      });

      if (error) {
        toast.error("Failed to add transaction");
      } else {
        toast.success("Transaction added successfully");
      }
    }

    setIsDialogOpen(false);
    setEditingId(null);
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete transaction");
    } else {
      toast.success("Transaction deleted successfully");
      fetchTransactions();
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setIsDialogOpen(true);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (filterType !== "all" && t.type !== filterType) return false;
    return true;
  });

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
        <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" name="description" />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update" : "Add"} Transaction
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No transactions found</p>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-lg">{transaction.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                        </p>
                        {transaction.description && (
                          <p className="text-sm text-muted-foreground mt-1">{transaction.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-xl font-bold ${
                        transaction.type === "income" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}$
                      {Number(transaction.amount).toFixed(2)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;