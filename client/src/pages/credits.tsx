import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, DollarSign, Archive, Clock, AlertTriangle, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { insertCreditSchema, CREDIT_SOURCES, type Credit, type InsertCredit, type Account, type Operator } from "@shared/schema";

const creditFormSchema = insertCreditSchema.extend({
  isActive: insertCreditSchema.shape.isActive.default(true),
});

interface CreditWithDetails extends Credit {
  operatorName?: string;
  accountName?: string;
}

export default function Credits() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  const [deletingCredit, setDeletingCredit] = useState<Credit | null>(null);
  const [accountFilter, setAccountFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const { data: credits, isLoading: creditsLoading } = useQuery<CreditWithDetails[]>({
    queryKey: ["/api/credits"],
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: operators } = useQuery<Operator[]>({
    queryKey: ["/api/operators"],
  });

  const form = useForm<InsertCredit>({
    resolver: zodResolver(creditFormSchema),
    defaultValues: {
      accountId: "",
      operatorId: "",
      originalAmount: "0",
      remainingBalance: "0",
      source: "",
      reference: "",
      dateReceived: new Date().toISOString().split("T")[0],
      notes: "",
      isActive: true,
    },
  });

  const createCreditMutation = useMutation({
    mutationFn: async (values: InsertCredit) => {
      return apiRequest("POST", "/api/credits", {
        ...values,
        remainingBalance: values.originalAmount,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Credit created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create credit", variant: "destructive" });
    },
  });

  const updateCreditMutation = useMutation({
    mutationFn: async (values: InsertCredit) => {
      return apiRequest("PATCH", `/api/credits/${editingCredit?.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsDialogOpen(false);
      setEditingCredit(null);
      form.reset();
      toast({ title: "Credit updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update credit", variant: "destructive" });
    },
  });

  const deleteCreditMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/credits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDeletingCredit(null);
      toast({ title: "Credit deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete credit", variant: "destructive" });
    },
  });

  const archiveCreditMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/credits/${id}`, { isActive: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Credit archived" });
    },
  });

  const restoreCreditMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/credits/${id}`, { isActive: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Credit restored" });
    },
  });

  const handleEdit = (credit: Credit) => {
    setEditingCredit(credit);
    form.reset({
      accountId: credit.accountId,
      operatorId: credit.operatorId,
      originalAmount: credit.originalAmount,
      remainingBalance: credit.remainingBalance,
      source: credit.source,
      reference: credit.reference || "",
      dateReceived: credit.dateReceived,
      notes: credit.notes || "",
      isActive: credit.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenNew = () => {
    setEditingCredit(null);
    form.reset({
      accountId: "",
      operatorId: "",
      originalAmount: "0",
      remainingBalance: "0",
      source: "",
      reference: "",
      dateReceived: new Date().toISOString().split("T")[0],
      notes: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const filteredCredits = credits?.filter((credit) => {
    if (accountFilter !== "all" && credit.accountId !== accountFilter) return false;
    if (statusFilter === "active" && !credit.isActive) return false;
    if (statusFilter === "archived" && credit.isActive) return false;
    return true;
  });

  const totalActiveCredits = credits
    ?.filter((c) => c.isActive)
    .reduce((sum, c) => sum + Number(c.remainingBalance), 0) || 0;

  const activeOperatorsCount = new Set(
    credits?.filter((c) => c.isActive).map((c) => c.operatorId)
  ).size;

  const onSubmit = (values: InsertCredit) => {
    if (editingCredit) {
      updateCreditMutation.mutate(values);
    } else {
      createCreditMutation.mutate(values);
    }
  };

  if (creditsLoading) {
    return <CreditsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Credit Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Manage operator credits and apply to payments
          </p>
        </div>
        <Button onClick={handleOpenNew} data-testid="button-new-credit">
          <Plus className="h-4 w-4 mr-2" />
          New Credit
        </Button>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-violet-600" />
          <div>
            <p className="font-medium">Total Active Credits</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalActiveCredits)}</p>
          </div>
        </div>
        <p className="text-muted-foreground">
          across {activeOperatorsCount} operators
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-40" data-testid="select-account-filter">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts?.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.accountPrefix}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredCredits && filteredCredits.length > 0 ? (
          filteredCredits.map((credit) => {
            const operator = operators?.find((o) => o.id === credit.operatorId);
            const account = accounts?.find((a) => a.id === credit.accountId);
            const applied = Number(credit.originalAmount) - Number(credit.remainingBalance);
            const isOld =
              new Date().getTime() - new Date(credit.dateReceived).getTime() >
              365 * 24 * 60 * 60 * 1000;

            return (
              <Card key={credit.id} className={!credit.isActive ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg">
                          {operator?.operatorName || "Unknown Operator"}
                        </h3>
                        <Badge variant="outline">{account?.accountPrefix}</Badge>
                        <Badge variant="secondary">{credit.source}</Badge>
                        {isOld && credit.isActive && (
                          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                            <AlertTriangle className="h-3 w-3" />
                            Unused 12+ months
                          </Badge>
                        )}
                        {!credit.isActive && (
                          <Badge variant="outline" className="gap-1">
                            <Archive className="h-3 w-3" />
                            Archived
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Balance</p>
                          <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(credit.remainingBalance)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Original</p>
                          <p>{formatCurrency(credit.originalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Applied</p>
                          <p>{formatCurrency(applied)}</p>
                        </div>
                      </div>
                      {credit.reference && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Ref: {credit.reference}
                        </p>
                      )}
                      {credit.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {credit.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Received: {formatShortDate(credit.dateReceived)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {credit.isActive && (
                        <Button size="sm" data-testid={`button-apply-credit-${credit.id}`}>
                          Apply to Payment
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-credit-menu-${credit.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(credit)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Credit
                          </DropdownMenuItem>
                          {credit.isActive ? (
                            <DropdownMenuItem onClick={() => archiveCreditMutation.mutate(credit.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => restoreCreditMutation.mutate(credit.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingCredit(credit)}
                            data-testid={`button-delete-credit-${credit.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Credit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No credits found</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                {statusFilter === "active"
                  ? "No active credits. Create one to start tracking."
                  : "No credits match your filters."}
              </p>
              <Button onClick={handleOpenNew}>
                <Plus className="h-4 w-4 mr-2" />
                New Credit
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCredit ? "Edit Credit" : "New Credit Entry"}</DialogTitle>
            <DialogDescription>
              {editingCredit
                ? "Update the credit details."
                : "Record a new operator credit to track and apply to future payments."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-credit-account">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.accountName} ({account.accountPrefix})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="operatorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-credit-operator">
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {operators?.map((operator) => (
                          <SelectItem key={operator.id} value={operator.id}>
                            {operator.operatorName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="originalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-credit-amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {editingCredit && (
                  <FormField
                    control={form.control}
                    name="remainingBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remaining Balance</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            data-testid="input-credit-balance"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="dateReceived"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Received</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          data-testid="input-credit-date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-credit-source">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CREDIT_SOURCES.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference/Document #</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional reference number"
                        data-testid="input-credit-reference"
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this credit"
                        data-testid="input-credit-notes"
                        {...field}
                        value={field.value || ""}
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
                  disabled={createCreditMutation.isPending || updateCreditMutation.isPending}
                  data-testid="button-save-credit"
                >
                  {createCreditMutation.isPending || updateCreditMutation.isPending
                    ? "Saving..."
                    : editingCredit
                    ? "Update Credit"
                    : "Save Credit"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCredit} onOpenChange={() => setDeletingCredit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this credit of {deletingCredit && formatCurrency(deletingCredit.originalAmount)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCredit && deleteCreditMutation.mutate(deletingCredit.id)}
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

function CreditsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
