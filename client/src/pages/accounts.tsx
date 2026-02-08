import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Building2, CreditCard, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertAccountSchema, type Account, type InsertAccount } from "@shared/schema";

const accountFormSchema = insertAccountSchema.extend({
  currentCheckNumber: insertAccountSchema.shape.currentCheckNumber.default(1000),
});

export default function Accounts() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const form = useForm<InsertAccount>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountName: "",
      accountPrefix: "",
      bankName: "",
      currentCheckNumber: 1000,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: InsertAccount) => {
      return apiRequest("POST", "/api/accounts", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Account created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create account", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: InsertAccount) => {
      return apiRequest("PATCH", `/api/accounts/${editingAccount?.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsDialogOpen(false);
      setEditingAccount(null);
      form.reset();
      toast({ title: "Account updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update account", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setDeletingAccount(null);
      toast({ title: "Account deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete account", variant: "destructive" });
    },
  });

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    form.reset({
      accountName: account.accountName,
      accountPrefix: account.accountPrefix,
      bankName: account.bankName || "",
      currentCheckNumber: account.currentCheckNumber || 1000,
    });
    setIsDialogOpen(true);
  };

  const handleOpenNew = () => {
    setEditingAccount(null);
    form.reset({
      accountName: "",
      accountPrefix: "",
      bankName: "",
      currentCheckNumber: 1000,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: InsertAccount) => {
    if (editingAccount) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  if (isLoading) {
    return <AccountsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage company accounts for payment processing
          </p>
        </div>
        <Button onClick={handleOpenNew} data-testid="button-new-account">
          <Plus className="h-4 w-4 mr-2" />
          New Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts?.map((account) => (
          <Card key={account.id} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{account.accountName}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {account.accountPrefix}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(account)}
                  data-testid={`button-edit-account-${account.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeletingAccount(account)}
                  data-testid={`button-delete-account-${account.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bank:</span>
                  <span>{account.bankName || "Not specified"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Next Check #:
                  </span>
                  <span className="font-mono">{account.currentCheckNumber}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!accounts || accounts.length === 0) && (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">No accounts yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Create your first account to start processing payments
            </p>
            <Button onClick={handleOpenNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Account
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Edit Account" : "New Account"}
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? "Update the account details below."
                : "Create a new company account for payment processing."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Great Plains Gas"
                        data-testid="input-account-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountPrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Prefix</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., GPG"
                        data-testid="input-account-prefix"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Western State Bank"
                        data-testid="input-bank-name"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentCheckNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Check Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        data-testid="input-check-number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                        value={field.value || 1000}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-account"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingAccount
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingAccount}
        onOpenChange={() => setDeletingAccount(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingAccount?.accountName}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAccount && deleteMutation.mutate(deletingAccount.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-10 w-full" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
