import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  History,
  FileDown,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  CreditCard,
  Calendar,
  MoreHorizontal,
  Trash2,
  Search,
  Upload,
  Filter,
  X,
  Download,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { Payment, Account, Operator } from "@shared/schema";

type SortField = "processedDate" | "operatorName" | "amount" | "paymentMethod" | "accountId";
type SortDirection = "asc" | "desc";

export default function PaymentHistory() {
  const { toast } = useToast();
  const [accountFilter, setAccountFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [operatorSearch, setOperatorSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("processedDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [reconciliationAccount, setReconciliationAccount] = useState("");

  const { data: allPayments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: operators } = useQuery<Operator[]>({
    queryKey: ["/api/operators"],
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDeletingPayment(null);
      toast({ title: "Payment deleted from history" });
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
      toast({ title: `${data.deleted} payment(s) deleted from history` });
    },
    onError: () => {
      toast({ title: "Failed to delete payments", variant: "destructive" });
    },
  });

  const sendBackToEntryMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await apiRequest("POST", `/api/payments/${paymentId}/send-back-to-entry`);
      return res.json() as Promise<Payment>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ 
        title: "Payment sent back to Entry Tracker",
        description: `${data.operatorName} moved to ${data.paymentMethod === "Check" ? "Bill Pay" : "ACH Payments"} section`
      });
    },
    onError: () => {
      toast({ title: "Failed to send payment back", variant: "destructive" });
    },
  });

  const processedPayments = allPayments?.filter((p) => p.status === "processed");

  const filteredAndSortedPayments = useMemo(() => {
    let result = processedPayments?.filter((payment) => {
      if (accountFilter !== "all" && payment.accountId !== accountFilter) return false;
      if (methodFilter !== "all" && payment.paymentMethod !== methodFilter) return false;
      if (operatorSearch && !payment.operatorName.toLowerCase().includes(operatorSearch.toLowerCase())) return false;
      if (startDate) {
        const paymentDate = new Date(payment.processedDate || payment.paymentDate);
        if (paymentDate < new Date(startDate)) return false;
      }
      if (endDate) {
        const paymentDate = new Date(payment.processedDate || payment.paymentDate);
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (paymentDate > endOfDay) return false;
      }
      return true;
    }) || [];

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "processedDate":
          comparison = new Date(a.processedDate || a.paymentDate).getTime() - 
                       new Date(b.processedDate || b.paymentDate).getTime();
          break;
        case "operatorName":
          comparison = a.operatorName.localeCompare(b.operatorName);
          break;
        case "amount":
          comparison = Number(a.amount) - Number(b.amount);
          break;
        case "paymentMethod":
          comparison = (a.paymentMethod || "").localeCompare(b.paymentMethod || "");
          break;
        case "accountId":
          const accA = accounts?.find(acc => acc.id === a.accountId)?.accountPrefix || "";
          const accB = accounts?.find(acc => acc.id === b.accountId)?.accountPrefix || "";
          comparison = accA.localeCompare(accB);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [processedPayments, accountFilter, methodFilter, operatorSearch, startDate, endDate, sortField, sortDirection, accounts]);

  const totalProcessed = processedPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const filteredTotal = filteredAndSortedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

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
    if (selectedPayments.size === filteredAndSortedPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(filteredAndSortedPayments.map((p) => p.id)));
    }
  };

  const toggleRowExpanded = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const clearFilters = () => {
    setAccountFilter("all");
    setMethodFilter("all");
    setOperatorSearch("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = accountFilter !== "all" || methodFilter !== "all" || operatorSearch || startDate || endDate;

  const exportToExcel = () => {
    if (filteredAndSortedPayments.length === 0) {
      toast({ title: "No payments to export", variant: "destructive" });
      return;
    }

    const headers = ["Processed Date", "Account", "Operator", "Owner #", "Invoice #", "Amount", "Method", "Check #", "Notes"];
    const rows = filteredAndSortedPayments.map(p => {
      const account = accounts?.find(a => a.id === p.accountId);
      return [
        formatShortDate(p.processedDate || p.paymentDate),
        account?.accountPrefix || "",
        p.operatorName,
        p.ownerNumber || "",
        p.docNum || "",
        Number(p.amount).toFixed(2),
        p.paymentMethod || "",
        p.checkNumber || "",
        p.notes || ""
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    const accountStr = accountFilter !== "all" 
      ? accounts?.find(a => a.id === accountFilter)?.accountPrefix || "All"
      : "All";
    link.href = url;
    link.download = `Payment_History_${accountStr}_${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${filteredAndSortedPayments.length} payments to CSV` });
  };

  const handleReconciliationUpload = () => {
    toast({ 
      title: "Feature Coming Soon", 
      description: "Bank reconciliation will be added in the next update."
    });
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
      data-testid={`sort-${field}`}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  if (paymentsLoading) {
    return <HistorySkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Payment History</h1>
          <p className="text-muted-foreground mt-1">
            View and manage completed payments
          </p>
        </div>
        <Button onClick={exportToExcel} data-testid="button-export-csv">
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      {/* Bank Reconciliation Placeholder */}
      <Collapsible open={reconciliationOpen} onOpenChange={setReconciliationOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Bank Reconciliation</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Upload bank transactions to verify payments cleared
                  </span>
                  {reconciliationOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload your monthly bank transaction CSV to automatically verify which payments have cleared your account.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Select Account</Label>
                  <Select value={reconciliationAccount} onValueChange={setReconciliationAccount}>
                    <SelectTrigger data-testid="select-reconciliation-account">
                      <SelectValue placeholder="Choose account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.accountPrefix} - {acc.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bank Transaction File</Label>
                  <Input type="file" accept=".csv" disabled data-testid="input-reconciliation-file" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Last upload: Never</p>
                <Button onClick={handleReconciliationUpload} disabled={!reconciliationAccount} data-testid="button-reconciliation-upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload and Match
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Processed</p>
                <p className="text-xl font-semibold">{formatCurrency(totalProcessed)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Filtered Results</p>
                <p className="text-xl font-semibold">{formatCurrency(filteredTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800">
                <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-xl font-semibold">{filteredAndSortedPayments.length} of {processedPayments?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger data-testid="select-history-account">
                  <SelectValue placeholder="All Accounts" />
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
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger data-testid="select-history-method">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="ACH">ACH</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-history-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-history-end-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Operator Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={operatorSearch}
                  onChange={(e) => setOperatorSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-history"
                />
              </div>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPayments.size > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{selectedPayments.size} selected</Badge>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDeleteConfirm(true)}
            data-testid="button-bulk-delete-history"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAndSortedPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPayments.size === filteredAndSortedPayments.length && filteredAndSortedPayments.length > 0}
                      onCheckedChange={toggleAll}
                      data-testid="checkbox-select-all-history"
                    />
                  </TableHead>
                  <TableHead className="w-8"></TableHead>
                  <SortHeader field="processedDate">Date</SortHeader>
                  <SortHeader field="accountId">Account</SortHeader>
                  <SortHeader field="operatorName">Operator</SortHeader>
                  <TableHead>Invoice #</TableHead>
                  <SortHeader field="amount">Amount</SortHeader>
                  <SortHeader field="paymentMethod">Method</SortHeader>
                  <TableHead>Check #</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedPayments.map((payment) => {
                  const account = accounts?.find((a) => a.id === payment.accountId);
                  const isExpanded = expandedRows.has(payment.id);
                  return (
                    <>
                      <TableRow key={payment.id} className="cursor-pointer" onClick={() => toggleRowExpanded(payment.id)}>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedPayments.has(payment.id)}
                            onCheckedChange={() => togglePaymentSelection(payment.id)}
                            data-testid={`checkbox-history-payment-${payment.id}`}
                          />
                        </TableCell>
                        <TableCell data-testid={`expand-${payment.id}`}>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatShortDate(payment.processedDate || payment.paymentDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{account?.accountPrefix}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{payment.operatorName}</TableCell>
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
                        <TableCell className="font-mono text-sm">
                          {payment.checkNumber || "-"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-history-menu-${payment.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => sendBackToEntryMutation.mutate(payment.id)}
                                data-testid={`button-send-back-entry-${payment.id}`}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Send Back to Entry Tracker
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeletingPayment(payment)}
                                data-testid={`button-delete-history-${payment.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete from History
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${payment.id}-details`} className="bg-muted/30">
                          <TableCell colSpan={10} className="py-4">
                            <div className="grid gap-4 md:grid-cols-3 pl-10">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Payment Info</p>
                                <p className="text-sm font-medium">
                                  {account?.accountName || "Account"} #{payment.ownerNumber || "-"} - Invoice #{payment.docNum || "-"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Received Date</p>
                                <p className="text-sm">{formatShortDate(payment.paymentDate)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Processed Date</p>
                                <p className="text-sm">{payment.processedDate ? formatShortDate(payment.processedDate) : "-"}</p>
                              </div>
                              {payment.entryEditedAt && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Entry Edited</p>
                                  <p className="text-sm">{formatShortDate(payment.entryEditedAt)}</p>
                                </div>
                              )}
                              {payment.entrySentAt && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Entry Sent</p>
                                  <p className="text-sm">{formatShortDate(payment.entrySentAt)}</p>
                                </div>
                              )}
                              {payment.importFileName && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Import File</p>
                                  <p className="text-sm">{payment.importFileName}</p>
                                </div>
                              )}
                              {payment.notes && (
                                <div className="md:col-span-3">
                                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                  <p className="text-sm">{payment.notes}</p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No payment history</h3>
              <p className="text-muted-foreground mt-1">
                {hasActiveFilters ? "No payments match your filters" : "Processed payments will appear here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Single Payment Confirmation */}
      <AlertDialog open={!!deletingPayment} onOpenChange={() => setDeletingPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment from History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment record for "{deletingPayment?.operatorName}" ({deletingPayment && formatCurrency(deletingPayment.amount)})? This action cannot be undone.
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
              Are you sure you want to delete {selectedPayments.size} payment record(s) from history? This action cannot be undone.
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
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-32" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
