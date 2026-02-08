import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { Payment, Account } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Copy, Check, ClipboardEdit, Banknote, CreditCard, Trash2, CheckCircle2, Send, ArrowUpDown } from "lucide-react";

export default function EntryTracker() {
  const { toast } = useToast();
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [achSortOrder, setAchSortOrder] = useState<"asc" | "desc">("asc");

  const { data: allPayments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const entryTrackerPayments = allPayments.filter(p => p.status === "in_entry_tracker");
  const billPayPayments = allPayments.filter(p => p.status === "in_bill_pay");
  const payments = [...entryTrackerPayments, ...billPayPayments];

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
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

  const markCompleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/payments/${id}/mark-complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Payment marked as complete" });
    },
    onError: () => {
      toast({ title: "Failed to mark payment as complete", variant: "destructive" });
    },
  });

  const markAllSentCompleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/mark-all-sent-complete");
      return res.json() as Promise<{ completedCount: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: `${data.completedCount} payment(s) marked as complete` });
    },
    onError: () => {
      toast({ title: "Failed to mark payments as complete", variant: "destructive" });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Payment> }) => {
      return apiRequest("PATCH", `/api/payments/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string, id: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(`${id}-${type}`);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleEditedChange = (payment: Payment, checked: boolean) => {
    updatePaymentMutation.mutate({
      id: payment.id,
      updates: {
        entryEdited: checked,
        entryEditedAt: checked ? new Date().toISOString() : null,
        entrySent: checked ? payment.entrySent : false,
        entrySentAt: checked ? payment.entrySentAt : null,
      } as any,
    });
  };

  const handleSentChange = (payment: Payment, checked: boolean) => {
    if (!payment.entryEdited && checked) {
      toast({
        title: "Cannot Mark as Sent",
        description: "Payment must be marked as Edited first",
        variant: "destructive",
      });
      return;
    }
    updatePaymentMutation.mutate({
      id: payment.id,
      updates: {
        entrySent: checked,
        entrySentAt: checked ? new Date().toISOString() : null,
      } as any,
    });
  };

  const getPaymentInfo = (payment: Payment) => {
    const account = accounts.find(a => a.id === payment.accountId);
    const operatorShortName = (payment.operatorName || "Unknown").split(" ")[0].toUpperCase();
    const accountName = account?.accountName || "Account";
    return `${operatorShortName} - ${accountName} #${payment.ownerNumber || ""} - Invoice #${payment.docNum || ""}`;
  };

  const getRowClassName = (payment: Payment) => {
    if (payment.entrySent) return "bg-green-50 dark:bg-green-950/20";
    if (payment.entryEdited) return "bg-yellow-50 dark:bg-yellow-950/20";
    return "";
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

  const toggleAllPayments = (paymentList: Payment[]) => {
    const allSelected = paymentList.every(p => selectedPayments.has(p.id));
    const newSelection = new Set(selectedPayments);
    if (allSelected) {
      paymentList.forEach(p => newSelection.delete(p.id));
    } else {
      paymentList.forEach(p => newSelection.add(p.id));
    }
    setSelectedPayments(newSelection);
  };

  const filteredPayments = payments.filter(p => {
    if (accountFilter !== "all" && p.accountId !== accountFilter) return false;
    return true;
  });

  // Entry Tracker payments (ACH and Check that need manual bank entry)
  const entryTrackerFiltered = filteredPayments.filter(p => p.status === "in_entry_tracker");
  const achPaymentsUnsorted = entryTrackerFiltered.filter(p => p.paymentMethod === "ACH");
  const achPayments = [...achPaymentsUnsorted].sort((a, b) => {
    const nameA = (a.operatorName || "").toLowerCase();
    const nameB = (b.operatorName || "").toLowerCase();
    return achSortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });
  const checkPayments = entryTrackerFiltered.filter(p => p.paymentMethod === "Check");
  
  // Bill Pay payments (checks sent to Bill Pay with their own workflow)
  const billPayFiltered = filteredPayments.filter(p => p.status === "in_bill_pay");

  const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const editedCount = filteredPayments.filter(p => p.entryEdited).length;
  const sentCount = filteredPayments.filter(p => p.entrySent).length;
  const editedProgress = filteredPayments.length > 0 ? (editedCount / filteredPayments.length) * 100 : 0;
  const sentProgress = filteredPayments.length > 0 ? (sentCount / filteredPayments.length) * 100 : 0;

  if (paymentsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const CopyButton = ({ text, id, type, label }: { text: string; id: string; type: string; label: string }) => {
    const isCopied = copiedId === `${id}-${type}`;
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard(text, id, type)}
        data-testid={`button-copy-${type}-${id}`}
      >
        {isCopied ? <Check className="h-3 w-3 mr-1 text-green-600" /> : <Copy className="h-3 w-3 mr-1" />}
        {isCopied ? "Copied" : label}
      </Button>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardEdit className="h-6 w-6" />
            Entry Tracker
          </h1>
          <p className="text-muted-foreground">
            Track manual bank entry progress for JIB payments
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedPayments.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteConfirm(true)}
              data-testid="button-bulk-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedPayments.size})
            </Button>
          )}
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-48" data-testid="select-account-filter">
              <SelectValue placeholder="Filter by Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.accountPrefix} - {acc.accountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPayments.length}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ACH Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(achPayments.reduce((sum, p) => sum + Number(p.amount), 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Manual Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(checkPayments.reduce((sum, p) => sum + Number(p.amount), 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bill Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billPayFiltered.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(billPayFiltered.reduce((sum, p) => sum + Number(p.amount), 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Edited</span>
              <span>{editedCount} of {filteredPayments.length}</span>
            </div>
            <Progress value={editedProgress} className="h-2" />
            <div className="flex items-center justify-between text-xs">
              <span>Sent</span>
              <span>{sentCount} of {filteredPayments.length}</span>
            </div>
            <Progress value={sentProgress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardEdit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Payments in Entry Tracker</h3>
            <p className="text-muted-foreground">
              Move ready payments from Pending Payments to start tracking bank entries.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {achPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  ACH Payments ({achPayments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={achPayments.length > 0 && achPayments.every(p => selectedPayments.has(p.id))}
                          onCheckedChange={() => toggleAllPayments(achPayments)}
                          data-testid="checkbox-select-all-ach"
                        />
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={() => setAchSortOrder(achSortOrder === "asc" ? "desc" : "asc")}
                          data-testid="button-sort-ach-operator"
                        >
                          Operator
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Edited</TableHead>
                      <TableHead className="text-center">Sent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {achPayments.map((payment) => (
                      <TableRow key={payment.id} className={getRowClassName(payment)}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPayments.has(payment.id)}
                            onCheckedChange={() => togglePaymentSelection(payment.id)}
                            data-testid={`checkbox-select-${payment.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.operatorName}</div>
                            <div className="text-xs text-muted-foreground">
                              {getPaymentInfo(payment)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{payment.docNum}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(payment.amount))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={payment.entryEdited || false}
                            onCheckedChange={(checked) => handleEditedChange(payment, checked as boolean)}
                            data-testid={`checkbox-edited-${payment.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={payment.entrySent || false}
                            onCheckedChange={(checked) => handleSentChange(payment, checked as boolean)}
                            disabled={!payment.entryEdited}
                            data-testid={`checkbox-sent-${payment.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <CopyButton
                              text={getPaymentInfo(payment)}
                              id={payment.id}
                              type="info"
                              label="Info"
                            />
                            <CopyButton
                              text={Number(payment.amount).toFixed(2)}
                              id={payment.id}
                              type="amount"
                              label="Amount"
                            />
                            {payment.entrySent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markCompleteMutation.mutate(payment.id)}
                                disabled={markCompleteMutation.isPending}
                                data-testid={`button-complete-${payment.id}`}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeletingPayment(payment)}
                              data-testid={`button-delete-${payment.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {checkPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Check / Bill Pay ({checkPayments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={checkPayments.length > 0 && checkPayments.every(p => selectedPayments.has(p.id))}
                          onCheckedChange={() => toggleAllPayments(checkPayments)}
                          data-testid="checkbox-select-all-check"
                        />
                      </TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Check #</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Edited</TableHead>
                      <TableHead className="text-center">Sent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkPayments.map((payment) => (
                      <TableRow key={payment.id} className={getRowClassName(payment)}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPayments.has(payment.id)}
                            onCheckedChange={() => togglePaymentSelection(payment.id)}
                            data-testid={`checkbox-select-${payment.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.operatorName}</div>
                            <div className="text-xs text-muted-foreground">
                              {getPaymentInfo(payment)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{payment.docNum}</TableCell>
                        <TableCell className="font-mono text-sm">{payment.checkNumber || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(payment.amount))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={payment.entryEdited || false}
                            onCheckedChange={(checked) => handleEditedChange(payment, checked as boolean)}
                            data-testid={`checkbox-edited-${payment.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={payment.entrySent || false}
                            onCheckedChange={(checked) => handleSentChange(payment, checked as boolean)}
                            disabled={!payment.entryEdited}
                            data-testid={`checkbox-sent-${payment.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <CopyButton
                              text={getPaymentInfo(payment)}
                              id={payment.id}
                              type="info"
                              label="Info"
                            />
                            <CopyButton
                              text={Number(payment.amount).toFixed(2)}
                              id={payment.id}
                              type="amount"
                              label="Amount"
                            />
                            {payment.checkNumber && (
                              <CopyButton
                                text={String(payment.checkNumber)}
                                id={payment.id}
                                type="check"
                                label="Check #"
                              />
                            )}
                            {payment.entrySent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markCompleteMutation.mutate(payment.id)}
                                disabled={markCompleteMutation.isPending}
                                data-testid={`button-complete-${payment.id}`}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeletingPayment(payment)}
                              data-testid={`button-delete-${payment.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Bill Pay Section */}
          {billPayFiltered.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Bill Pay ({billPayFiltered.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={billPayFiltered.length > 0 && billPayFiltered.every(p => selectedPayments.has(p.id))}
                          onCheckedChange={() => toggleAllPayments(billPayFiltered)}
                          data-testid="checkbox-select-all-billpay"
                        />
                      </TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Check #</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Edited</TableHead>
                      <TableHead className="text-center">Sent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billPayFiltered.map((payment) => (
                      <TableRow key={payment.id} className={getRowClassName(payment)}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPayments.has(payment.id)}
                            onCheckedChange={() => togglePaymentSelection(payment.id)}
                            data-testid={`checkbox-select-${payment.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{payment.operatorName}</div>
                          <div className="text-xs text-muted-foreground">
                            {accounts.find(a => a.id === payment.accountId)?.accountPrefix || ""}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{payment.docNum}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">#{payment.checkNumber}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(payment.amount))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={payment.entryEdited || false}
                            onCheckedChange={(checked) => handleEditedChange(payment, checked as boolean)}
                            data-testid={`checkbox-edited-${payment.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={payment.entrySent || false}
                            onCheckedChange={(checked) => handleSentChange(payment, checked as boolean)}
                            disabled={!payment.entryEdited}
                            data-testid={`checkbox-sent-${payment.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <CopyButton
                              text={getPaymentInfo(payment)}
                              id={payment.id}
                              type="info"
                              label="Info"
                            />
                            <CopyButton
                              text={Number(payment.amount).toFixed(2)}
                              id={payment.id}
                              type="amount"
                              label="Amount"
                            />
                            {payment.checkNumber && (
                              <CopyButton
                                text={String(payment.checkNumber)}
                                id={payment.id}
                                type="check"
                                label="Check #"
                              />
                            )}
                            {payment.entrySent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markCompleteMutation.mutate(payment.id)}
                                disabled={markCompleteMutation.isPending}
                                data-testid={`button-complete-${payment.id}`}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeletingPayment(payment)}
                              data-testid={`button-delete-${payment.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Bulk Mark Complete Action */}
          {sentCount > 0 && (
            <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{sentCount} payment(s) ready to complete</p>
                      <p className="text-sm text-muted-foreground">
                        Mark all sent payments as processed and move to Payment History
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => markAllSentCompleteMutation.mutate()}
                    disabled={markAllSentCompleteMutation.isPending}
                    data-testid="button-mark-all-complete"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {markAllSentCompleteMutation.isPending 
                      ? "Completing..." 
                      : `Mark All Sent as Complete (${sentCount})`
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Delete Single Payment Confirmation */}
      <AlertDialog open={!!deletingPayment} onOpenChange={() => setDeletingPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment for{" "}
              <strong>{deletingPayment?.operatorName}</strong> ({formatCurrency(Number(deletingPayment?.amount || 0))})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPayment && deletePaymentMutation.mutate(deletingPayment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
            <AlertDialogTitle>Delete {selectedPayments.size} Payments?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedPayments.size} selected payment(s)?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedPayments))}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
