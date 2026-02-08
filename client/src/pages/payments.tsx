import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus,
  Clock,
  Search,
  Trash2,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  CircleDot,
  XCircle,
  MoreHorizontal,
  DollarSign,
  Copy,
  Coins,
  Send,
  Download,
  ArrowRight,
  ClipboardEdit,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { Payment, Account, Operator } from "@shared/schema";

const quickPayFormSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  operatorId: z.string().min(1, "Operator is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  ownerNumber: z.string().optional(),
  docNum: z.string().optional(),
  paymentMethod: z.enum(["ACH", "Check"]).default("ACH"),
  notes: z.string().optional(),
});

type QuickPayFormValues = z.infer<typeof quickPayFormSchema>;

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pending: {
    label: "Pending",
    icon: AlertTriangle,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  processing: {
    label: "Processing",
    icon: CircleDot,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  processed: {
    label: "Processed",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export default function Payments() {
  const { toast } = useToast();
  const [isQuickPayOpen, setIsQuickPayOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [editingNotes, setEditingNotes] = useState<Payment | null>(null);
  const [notesText, setNotesText] = useState("");
  const [assigningPayment, setAssigningPayment] = useState<Payment | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [saveAsAlias, setSaveAsAlias] = useState(true);
  const [achSuccessData, setAchSuccessData] = useState<{
    fileName: string;
    paymentCount: number;
    totalAmount: number;
    batchId: string;
    csvContent: string;
  } | null>(null);

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: operators } = useQuery<Operator[]>({
    queryKey: ["/api/operators"],
  });

  const form = useForm<QuickPayFormValues>({
    resolver: zodResolver(quickPayFormSchema),
    defaultValues: {
      accountId: "",
      operatorId: "",
      amount: 0,
      ownerNumber: "",
      docNum: "",
      paymentMethod: "ACH",
      notes: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (values: QuickPayFormValues) => {
      const operator = operators?.find((o) => o.id === values.operatorId);
      return apiRequest("POST", "/api/payments", {
        ...values,
        operatorName: operator?.operatorName || "Unknown",
        paymentDate: new Date().toISOString().split("T")[0],
        status: values.paymentMethod === "Check" ? "pending" : operator?.hasAch ? "ready" : "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsQuickPayOpen(false);
      form.reset();
      toast({ title: "Payment added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add payment", variant: "destructive" });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Payment> }) => {
      return apiRequest("PATCH", `/api/payments/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Payment updated" });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDeletingPayment(null);
      toast({ title: "Payment deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete payment", variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest("POST", "/api/payments/bulk-delete", { ids });
      return res.json() as Promise<{ deleted: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setSelectedPayments(new Set());
      setShowBulkDeleteConfirm(false);
      toast({ title: `${data.deleted} payment(s) deleted` });
    },
    onError: () => {
      toast({ title: "Failed to delete payments", variant: "destructive" });
    },
  });

  const assignOperatorMutation = useMutation({
    mutationFn: async ({ paymentId, operatorId, saveAsAlias }: { paymentId: string; operatorId: string; saveAsAlias: boolean }) => {
      return apiRequest("POST", `/api/payments/${paymentId}/assign-operator`, { operatorId, saveAsAlias });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operators"] });
      setAssigningPayment(null);
      setSelectedOperatorId("");
      setSaveAsAlias(true);
      toast({ title: "Operator assigned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to assign operator", variant: "destructive" });
    },
  });

  const generateAchMutation = useMutation({
    mutationFn: async (paymentIds: string[]) => {
      const res = await apiRequest("POST", "/api/generate-ach", { paymentIds });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setSelectedPayments(new Set());
      setAchSuccessData({
        fileName: data.fileName,
        paymentCount: data.paymentCount,
        totalAmount: data.totalAmount,
        batchId: data.batchId,
        csvContent: data.csvContent,
      });
    },
    onError: () => {
      toast({ title: "Failed to generate ACH file", variant: "destructive" });
    },
  });

  const sendChecksToBillPayMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/send-checks-to-bill-pay");
      return res.json();
    },
    onSuccess: (data: { count: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ 
        title: `Sent ${data.count} checks to Bill Pay`,
        description: "Checks are now awaiting confirmation on the Processing page."
      });
    },
    onError: () => {
      toast({ title: "Failed to send checks to Bill Pay", variant: "destructive" });
    },
  });

  const moveToEntryTrackerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/move-to-entry-tracker");
      return res.json();
    },
    onSuccess: (data: { movedCount: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ 
        title: `Moved ${data.movedCount} payments to Entry Tracker`,
        description: "Go to Entry Tracker to manage bank entries."
      });
    },
    onError: () => {
      toast({ title: "Failed to move payments to Entry Tracker", variant: "destructive" });
    },
  });

  const filteredPayments = payments?.filter((payment) => {
    // Always exclude processing, processed, entry tracker, and bill pay payments - they belong on other pages
    if (payment.status === "processing" || payment.status === "processed" || payment.status === "in_entry_tracker" || payment.status === "in_bill_pay") return false;
    
    if (statusFilter !== "all") {
      if (statusFilter === "needs_attention") {
        // Needs attention = pending or failed status, or missing operator
        if (!((payment.status === "pending" || payment.status === "failed") || !payment.operatorId)) return false;
      } else if (payment.status !== statusFilter) {
        return false;
      }
    }
    if (accountFilter !== "all" && payment.accountId !== accountFilter) return false;
    if (searchQuery && !payment.operatorName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const summary = {
    achReady: payments?.filter((p) => p.status === "ready").reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    achReadyCount: payments?.filter((p) => p.status === "ready").length || 0,
    checkPayments: payments?.filter((p) => p.paymentMethod === "Check" && (p.status === "pending" || p.status === "ready")).reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    checkCount: payments?.filter((p) => p.paymentMethod === "Check" && (p.status === "pending" || p.status === "ready")).length || 0,
    needsAttention: payments?.filter((p) => p.status === "pending" || p.status === "failed").length || 0,
  };

  const togglePaymentSelection = (id: string) => {
    const newSelection = new Set(selectedPayments);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedPayments(newSelection);
  };

  const toggleAll = () => {
    if (selectedPayments.size === filteredPayments?.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(filteredPayments?.map((p) => p.id)));
    }
  };

  const onSubmit = (values: QuickPayFormValues) => {
    createPaymentMutation.mutate(values);
  };

  if (paymentsLoading) {
    return <PaymentsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pending Payments</h1>
          <p className="text-muted-foreground mt-1">
            Manage imported payments, generate ACH files, and track check payments
          </p>
        </div>
        <Button onClick={() => setIsQuickPayOpen(true)} data-testid="button-quick-pay">
          <Plus className="h-4 w-4 mr-2" />
          Quick Pay
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium">ACH Ready</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(summary.achReady)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({summary.achReadyCount} payments)
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Check Payments</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(summary.checkPayments)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({summary.checkCount} payments)
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium">Needs Attention</p>
                <p className="text-lg font-semibold">{summary.needsAttention}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry Tracker Action */}
      {summary.achReadyCount > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardEdit className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium">{summary.achReadyCount} payments ready for bank entry</p>
                  <p className="text-sm text-muted-foreground">Move to Entry Tracker to manage manual bank entry</p>
                </div>
              </div>
              <Button 
                onClick={() => moveToEntryTrackerMutation.mutate()}
                disabled={moveToEntryTrackerMutation.isPending}
                data-testid="button-move-to-entry-tracker"
              >
                <ClipboardEdit className="h-4 w-4 mr-2" />
                {moveToEntryTrackerMutation.isPending ? "Moving..." : "Move to Entry Tracker"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
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
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
              <SelectItem value="needs_attention">Needs Attention</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search operator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
              data-testid="input-search-payments"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary.checkCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => sendChecksToBillPayMutation.mutate()}
              disabled={sendChecksToBillPayMutation.isPending}
              data-testid="button-send-checks"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendChecksToBillPayMutation.isPending 
                ? "Sending..." 
                : `Send ${summary.checkCount} Checks to Bill Pay`}
            </Button>
          )}
          {selectedPayments.size > 0 && (
            <>
              <Badge variant="secondary">{selectedPayments.size} selected</Badge>
              <Button 
                variant="outline" 
                size="sm" 
                data-testid="button-generate-ach"
                onClick={() => {
                  const achPaymentIds = Array.from(selectedPayments).filter((id) => {
                    const p = payments?.find((pay) => pay.id === id);
                    return p?.paymentMethod === "ACH" && (p.status === "ready" || p.status === "pending");
                  });
                  if (achPaymentIds.length > 0) {
                    generateAchMutation.mutate(achPaymentIds);
                  } else {
                    toast({ title: "No ACH payments selected", variant: "destructive" });
                  }
                }}
                disabled={generateAchMutation.isPending}
              >
                <FileDown className="h-4 w-4 mr-2" />
                {generateAchMutation.isPending ? "Generating..." : "Generate ACH File"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                data-testid="button-bulk-delete"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {filteredPayments && filteredPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPayments.size === filteredPayments.length && filteredPayments.length > 0}
                      onCheckedChange={toggleAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Owner #</TableHead>
                  <TableHead>Doc #</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const statusInfo = statusConfig[payment.status || "pending"];
                  const StatusIcon = statusInfo?.icon || Clock;
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPayments.has(payment.id)}
                          onCheckedChange={() => togglePaymentSelection(payment.id)}
                          data-testid={`checkbox-payment-${payment.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`gap-1 ${statusInfo?.className || ""}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo?.label || payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatShortDate(payment.paymentDate)}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{payment.operatorName}</span>
                          {payment.isPotentialDuplicate && (
                            <Badge 
                              variant="destructive" 
                              className="gap-1 shrink-0"
                              data-testid={`badge-duplicate-${payment.id}`}
                            >
                              <Copy className="h-3 w-3" />
                              Duplicate
                            </Badge>
                          )}
                          {payment.hasAvailableCredit && (
                            <Badge 
                              className="gap-1 shrink-0 bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300"
                              data-testid={`badge-credit-${payment.id}`}
                            >
                              <Coins className="h-3 w-3" />
                              Credit: {formatCurrency(payment.availableCreditAmount || "0")}
                            </Badge>
                          )}
                        </div>
                        {payment.paidByCredit && (
                          <div className="flex items-center gap-1 text-xs text-violet-600 mt-1">
                            <DollarSign className="h-3 w-3" />
                            Paid by Credit
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {payment.ownerNumber || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground truncate max-w-[120px]">
                        {payment.docNum || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {payment.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-payment-menu-${payment.id}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setViewingPayment(payment)}
                              data-testid={`button-view-details-${payment.id}`}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingPayment(payment);
                                setEditAmount(payment.amount);
                              }}
                              data-testid={`button-edit-amount-${payment.id}`}
                            >
                              Edit Amount
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingNotes(payment);
                                setNotesText(payment.notes || "");
                              }}
                              data-testid={`button-edit-notes-${payment.id}`}
                            >
                              {payment.notes ? "Edit Notes" : "Add Notes"}
                            </DropdownMenuItem>
                            {!payment.operatorId && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setAssigningPayment(payment);
                                  setSelectedOperatorId("");
                                  setSaveAsAlias(true);
                                }}
                                className="text-blue-600"
                                data-testid={`button-assign-operator-${payment.id}`}
                              >
                                Assign Operator
                              </DropdownMenuItem>
                            )}
                            {payment.hasAvailableCredit && !payment.paidByCredit && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const creditAmount = Number(payment.availableCreditAmount || 0);
                                  const paymentAmount = Number(payment.amount);
                                  const amountToApply = Math.min(creditAmount, paymentAmount);
                                  const newAmount = paymentAmount - amountToApply;
                                  updatePaymentMutation.mutate({
                                    id: payment.id,
                                    updates: {
                                      amount: newAmount.toFixed(2),
                                      originalAmount: payment.originalAmount || payment.amount,
                                      creditApplied: amountToApply.toFixed(2),
                                      paidByCredit: newAmount === 0,
                                      hasAvailableCredit: false,
                                      availableCreditAmount: null,
                                    },
                                  });
                                  toast({ 
                                    title: `Applied ${formatCurrency(amountToApply.toFixed(2))} credit`,
                                    description: newAmount > 0 ? `Remaining: ${formatCurrency(newAmount.toFixed(2))}` : "Fully paid by credit"
                                  });
                                }}
                                className="text-violet-600"
                                data-testid={`button-apply-credit-${payment.id}`}
                              >
                                <Coins className="h-4 w-4 mr-2" />
                                Apply Credit ({formatCurrency(payment.availableCreditAmount || "0")})
                              </DropdownMenuItem>
                            )}
                            {payment.paidByCredit && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const originalAmount = payment.originalAmount || payment.amount;
                                  updatePaymentMutation.mutate({
                                    id: payment.id,
                                    updates: {
                                      amount: originalAmount,
                                      originalAmount: null,
                                      creditApplied: "0",
                                      paidByCredit: false,
                                    },
                                  });
                                  toast({ title: "Credit removed", description: `Amount restored to ${formatCurrency(originalAmount)}` });
                                }}
                                className="text-amber-600"
                                data-testid={`button-remove-credit-${payment.id}`}
                              >
                                Remove Applied Credit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                updatePaymentMutation.mutate({
                                  id: payment.id,
                                  updates: {
                                    paymentMethod:
                                      payment.paymentMethod === "ACH"
                                        ? "Check"
                                        : "ACH",
                                  },
                                })
                              }
                            >
                              Toggle ACH/Check
                            </DropdownMenuItem>
                            {payment.status === "processing" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updatePaymentMutation.mutate({
                                    id: payment.id,
                                    updates: { status: "processed" },
                                  })
                                }
                              >
                                Mark as Processed
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingPayment(payment)}
                              data-testid={`button-delete-payment-${payment.id}`}
                            >
                              Delete Payment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No pending payments</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Import JIB data or add a quick payment to get started
              </p>
              <Button onClick={() => setIsQuickPayOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Quick Pay
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Pay Dialog */}
      <Dialog open={isQuickPayOpen} onOpenChange={setIsQuickPayOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Quick Payment Entry</DialogTitle>
            <DialogDescription>
              Add a single payment outside of the import workflow for one-off situations.
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
                        <SelectTrigger data-testid="select-account">
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
                        <SelectTrigger data-testid="select-operator">
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownerNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., GPG01"
                          data-testid="input-owner-number"
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
                name="docNum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice/Reference</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Invoice or document number"
                        data-testid="input-doc-num"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACH">ACH</SelectItem>
                        <SelectItem value="Check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsQuickPayOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPaymentMutation.isPending} data-testid="button-save-payment">
                  {createPaymentMutation.isPending ? "Adding..." : "Add Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Single Payment Confirmation */}
      <AlertDialog open={!!deletingPayment} onOpenChange={() => setDeletingPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment to "{deletingPayment?.operatorName}" for{" "}
              {deletingPayment && formatCurrency(deletingPayment.amount)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPayment && deletePaymentMutation.mutate(deletingPayment.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedPayments.size} Payment(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedPayments.size} selected payment(s)? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedPayments))}
              className="bg-destructive text-destructive-foreground"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Amount Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={() => setEditingPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment Amount</DialogTitle>
            <DialogDescription>
              Update the amount for {editingPayment?.operatorName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                data-testid="input-edit-amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPayment(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingPayment) {
                  updatePaymentMutation.mutate({
                    id: editingPayment.id,
                    updates: { amount: editAmount },
                  });
                  setEditingPayment(null);
                }
              }}
              disabled={updatePaymentMutation.isPending}
              data-testid="button-save-amount"
            >
              Save Amount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingPayment} onOpenChange={() => setViewingPayment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {viewingPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Operator</p>
                  <p className="font-medium">{viewingPayment.operatorName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(viewingPayment.amount)}</p>
                  {viewingPayment.originalAmount && (
                    <p className="text-xs text-muted-foreground">
                      Original: {formatCurrency(viewingPayment.originalAmount)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Received Date</p>
                  <p className="font-medium">{formatShortDate(viewingPayment.paymentDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="secondary" className={statusConfig[viewingPayment.status || "pending"]?.className}>
                    {statusConfig[viewingPayment.status || "pending"]?.label || viewingPayment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Owner Number</p>
                  <p className="font-mono">{viewingPayment.ownerNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Doc Number</p>
                  <p className="font-mono">{viewingPayment.docNum || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{viewingPayment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Credit Applied</p>
                  <p className="font-medium">{formatCurrency(viewingPayment.creditApplied || "0")}</p>
                </div>
              </div>
              {viewingPayment.notes && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Notes</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{viewingPayment.notes}</p>
                </div>
              )}
              {viewingPayment.importFileName && (
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Imported from: {viewingPayment.importFileName}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingPayment(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notes Dialog */}
      <Dialog open={!!editingNotes} onOpenChange={() => setEditingNotes(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingNotes?.notes ? "Edit Notes" : "Add Notes"}</DialogTitle>
            <DialogDescription>
              Add notes for the payment to {editingNotes?.operatorName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Enter notes..."
                className="min-h-[100px]"
                data-testid="input-edit-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNotes(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingNotes) {
                  updatePaymentMutation.mutate({
                    id: editingNotes.id,
                    updates: { notes: notesText || null },
                  });
                  setEditingNotes(null);
                }
              }}
              disabled={updatePaymentMutation.isPending}
              data-testid="button-save-notes"
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Operator Dialog */}
      <Dialog open={!!assigningPayment} onOpenChange={() => setAssigningPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Operator</DialogTitle>
            <DialogDescription>
              Select an operator for "{assigningPayment?.operatorName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="operator-select">Select Operator</Label>
              <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId}>
                <SelectTrigger data-testid="select-assign-operator">
                  <SelectValue placeholder="Choose an operator..." />
                </SelectTrigger>
                <SelectContent>
                  {operators?.map((operator) => (
                    <SelectItem key={operator.id} value={operator.id}>
                      {operator.operatorName}
                      {operator.hasAch && " (ACH)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-alias"
                checked={saveAsAlias}
                onCheckedChange={(checked) => setSaveAsAlias(checked === true)}
                data-testid="checkbox-save-alias"
              />
              <Label htmlFor="save-alias" className="text-sm font-normal cursor-pointer">
                Remember this for future imports
              </Label>
            </div>
            {saveAsAlias && (
              <p className="text-xs text-muted-foreground">
                "{assigningPayment?.operatorName}" will automatically match to this operator in future imports.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigningPayment(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (assigningPayment && selectedOperatorId) {
                  assignOperatorMutation.mutate({
                    paymentId: assigningPayment.id,
                    operatorId: selectedOperatorId,
                    saveAsAlias,
                  });
                }
              }}
              disabled={!selectedOperatorId || assignOperatorMutation.isPending}
              data-testid="button-confirm-assign-operator"
            >
              Assign Operator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={achSuccessData !== null} onOpenChange={(open) => !open && setAchSuccessData(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              ACH File Generated
            </DialogTitle>
            <DialogDescription>
              Your ACH file has been created and payments have been moved to processing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Name</span>
                <span className="font-medium">{achSuccessData?.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payments</span>
                <span className="font-medium">{achSuccessData?.paymentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">{formatCurrency(achSuccessData?.totalAmount || 0)}</span>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (achSuccessData?.csvContent && achSuccessData?.fileName) {
                  const blob = new Blob([achSuccessData.csvContent], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = achSuccessData.fileName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              }}
              data-testid="button-download-ach"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV File
            </Button>
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium">Next Steps</h4>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">1.</span>
                  Upload the CSV to Western State Bank
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">2.</span>
                  Wait for bank confirmation (usually 1-2 business days)
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">3.</span>
                  Mark the batch as processed in the Processing page
                </li>
              </ol>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setAchSuccessData(null)}>
              Close
            </Button>
            <Link href="/processing">
              <Button data-testid="button-go-to-processing">
                Go to Processing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
