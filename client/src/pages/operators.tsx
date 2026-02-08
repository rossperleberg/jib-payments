import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Factory, Edit, Trash2, Search, CheckCircle2, XCircle, Eye, ChevronDown, ChevronUp, Mail, Phone, User, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
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
import { insertOperatorSchema, type Operator, type InsertOperator } from "@shared/schema";

const operatorFormSchema = insertOperatorSchema.extend({
  hasAch: insertOperatorSchema.shape.hasAch.default(false),
});

export default function Operators() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingOperator, setViewingOperator] = useState<Operator | null>(null);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [deletingOperator, setDeletingOperator] = useState<Operator | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: operators, isLoading } = useQuery<Operator[]>({
    queryKey: ["/api/operators"],
  });

  const filteredOperators = operators?.filter((op) =>
    op.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (op.legalEntityName && op.legalEntityName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const form = useForm<InsertOperator>({
    resolver: zodResolver(operatorFormSchema),
    defaultValues: {
      operatorName: "",
      legalEntityName: "",
      hasAch: false,
      bankName: "",
      bankAddress: "",
      routingNumber: "",
      accountNumber: "",
      wireRouting: "",
      swiftCode: "",
      remittanceEmail: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      notes: "",
    },
  });

  const hasAch = form.watch("hasAch");

  const createMutation = useMutation({
    mutationFn: async (values: InsertOperator) => {
      return apiRequest("POST", "/api/operators", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operators"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Operator created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create operator", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: InsertOperator) => {
      return apiRequest("PATCH", `/api/operators/${editingOperator?.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operators"] });
      setIsDialogOpen(false);
      setEditingOperator(null);
      form.reset();
      toast({ title: "Operator updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update operator", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/operators/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operators"] });
      setDeletingOperator(null);
      toast({ title: "Operator deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete operator", variant: "destructive" });
    },
  });

  const handleEdit = (operator: Operator) => {
    setEditingOperator(operator);
    form.reset({
      operatorName: operator.operatorName,
      legalEntityName: operator.legalEntityName || "",
      hasAch: operator.hasAch || false,
      bankName: operator.bankName || "",
      bankAddress: operator.bankAddress || "",
      routingNumber: operator.routingNumber || "",
      accountNumber: operator.accountNumber || "",
      wireRouting: operator.wireRouting || "",
      swiftCode: operator.swiftCode || "",
      remittanceEmail: operator.remittanceEmail || "",
      contactName: operator.contactName || "",
      contactPhone: operator.contactPhone || "",
      contactEmail: operator.contactEmail || "",
      notes: operator.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenNew = () => {
    setEditingOperator(null);
    form.reset({
      operatorName: "",
      legalEntityName: "",
      hasAch: false,
      bankName: "",
      bankAddress: "",
      routingNumber: "",
      accountNumber: "",
      wireRouting: "",
      swiftCode: "",
      remittanceEmail: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleExportCSV = () => {
    if (!operators || operators.length === 0) {
      toast({ title: "No operators to export", variant: "destructive" });
      return;
    }

    const headers = [
      "Operator Name",
      "Legal Entity Name",
      "Aliases",
      "Has ACH",
      "Bank Name",
      "Bank Address",
      "ACH Routing Number",
      "Wire Routing Number",
      "Account Number",
      "SWIFT Code",
      "Remittance Email",
      "Contact Name",
      "Contact Phone",
      "Contact Email",
      "Notes"
    ];

    const csvRows = [headers.join(",")];
    
    for (const op of operators) {
      const row = [
        `"${(op.operatorName || "").replace(/"/g, '""')}"`,
        `"${(op.legalEntityName || "").replace(/"/g, '""')}"`,
        `"${(op.aliases?.join("; ") || "").replace(/"/g, '""')}"`,
        op.hasAch ? "Yes" : "No",
        `"${(op.bankName || "").replace(/"/g, '""')}"`,
        `"${(op.bankAddress || "").replace(/"/g, '""')}"`,
        `"${(op.routingNumber || "").replace(/"/g, '""')}"`,
        `"${(op.wireRouting || "").replace(/"/g, '""')}"`,
        `"${(op.accountNumber || "").replace(/"/g, '""')}"`,
        `"${(op.swiftCode || "").replace(/"/g, '""')}"`,
        `"${(op.remittanceEmail || "").replace(/"/g, '""')}"`,
        `"${(op.contactName || "").replace(/"/g, '""')}"`,
        `"${(op.contactPhone || "").replace(/"/g, '""')}"`,
        `"${(op.contactEmail || "").replace(/"/g, '""')}"`,
        `"${(op.notes || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `operators_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: "Operators exported successfully" });
  };

  const onSubmit = (values: InsertOperator) => {
    if (editingOperator) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  if (isLoading) {
    return <OperatorsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Operators</h1>
          <p className="text-muted-foreground mt-1">
            Manage operator information and ACH banking details
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} data-testid="button-export-operators">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleOpenNew} data-testid="button-new-operator">
            <Plus className="h-4 w-4 mr-2" />
            New Operator
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base font-medium">
              All Operators ({filteredOperators?.length || 0})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search operators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-operators"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOperators && filteredOperators.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Operator Name</TableHead>
                  <TableHead>Legal Entity</TableHead>
                  <TableHead>ACH Status</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Routing #</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperators.map((operator) => (
                  <Collapsible key={operator.id} asChild open={expandedRows.has(operator.id)}>
                    <>
                      <TableRow className="cursor-pointer" onClick={() => toggleRow(operator.id)}>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`button-expand-operator-${operator.id}`}>
                              {expandedRows.has(operator.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium">{operator.operatorName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {operator.legalEntityName || "-"}
                        </TableCell>
                        <TableCell>
                          {operator.hasAch ? (
                            <Badge variant="default" className="gap-1 bg-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              ACH
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Check Only
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {operator.bankName || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {operator.routingNumber || "-"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setViewingOperator(operator)}
                              data-testid={`button-view-operator-${operator.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(operator)}
                              data-testid={`button-edit-operator-${operator.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeletingOperator(operator)}
                              data-testid={`button-delete-operator-${operator.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={7} className="py-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm px-4">
                              <div>
                                <p className="text-muted-foreground text-xs uppercase">Account #</p>
                                <p className="font-mono">{operator.accountNumber ? `****${operator.accountNumber.slice(-4)}` : "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs uppercase">Wire Routing</p>
                                <p className="font-mono">{operator.wireRouting || "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs uppercase">SWIFT Code</p>
                                <p className="font-mono">{operator.swiftCode || "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs uppercase">Remittance Email</p>
                                <p>{operator.remittanceEmail || "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs uppercase">Contact Name</p>
                                <p>{operator.contactName || "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs uppercase">Contact Phone</p>
                                <p>{operator.contactPhone || "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs uppercase">Contact Email</p>
                                <p>{operator.contactEmail || "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs uppercase">Notes</p>
                                <p className="truncate">{operator.notes || "-"}</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Factory className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No operators found</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first operator to start processing payments"}
              </p>
              {!searchQuery && (
                <Button onClick={handleOpenNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Operator
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Operator Details Dialog */}
      <Dialog open={!!viewingOperator} onOpenChange={() => setViewingOperator(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingOperator?.operatorName}</DialogTitle>
            <DialogDescription>
              {viewingOperator?.legalEntityName}
            </DialogDescription>
          </DialogHeader>
          {viewingOperator && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                {viewingOperator.hasAch ? (
                  <Badge variant="default" className="gap-1 bg-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    ACH Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Check Only
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase">Banking Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{viewingOperator.bankName || "-"}</p>
                    </div>
                    {viewingOperator.bankAddress && (
                      <div>
                        <p className="text-xs text-muted-foreground">Bank Address</p>
                        <p>{viewingOperator.bankAddress}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">ACH Routing Number</p>
                      <p className="font-mono">{viewingOperator.routingNumber || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Account Number</p>
                      <p className="font-mono">{viewingOperator.accountNumber || "-"}</p>
                    </div>
                    {viewingOperator.wireRouting && (
                      <div>
                        <p className="text-xs text-muted-foreground">Wire Routing</p>
                        <p className="font-mono">{viewingOperator.wireRouting}</p>
                      </div>
                    )}
                    {viewingOperator.swiftCode && (
                      <div>
                        <p className="text-xs text-muted-foreground">SWIFT Code</p>
                        <p className="font-mono">{viewingOperator.swiftCode}</p>
                      </div>
                    )}
                    {viewingOperator.remittanceEmail && (
                      <div>
                        <p className="text-xs text-muted-foreground">Remittance Email</p>
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {viewingOperator.remittanceEmail}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase">Contact Information</h4>
                  <div className="space-y-2">
                    {viewingOperator.contactName && (
                      <div>
                        <p className="text-xs text-muted-foreground">Contact Name</p>
                        <p className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {viewingOperator.contactName}
                        </p>
                      </div>
                    )}
                    {viewingOperator.contactPhone && (
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {viewingOperator.contactPhone}
                        </p>
                      </div>
                    )}
                    {viewingOperator.contactEmail && (
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {viewingOperator.contactEmail}
                        </p>
                      </div>
                    )}
                    {!viewingOperator.contactName && !viewingOperator.contactPhone && !viewingOperator.contactEmail && (
                      <p className="text-muted-foreground text-sm">No contact information</p>
                    )}
                  </div>
                </div>
              </div>

              {viewingOperator.notes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground uppercase mb-2">Notes</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded">{viewingOperator.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingOperator(null)}>
              Close
            </Button>
            <Button onClick={() => {
              if (viewingOperator) {
                handleEdit(viewingOperator);
                setViewingOperator(null);
              }
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Operator Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOperator ? "Edit Operator" : "New Operator"}
            </DialogTitle>
            <DialogDescription>
              {editingOperator
                ? "Update the operator details and banking information."
                : "Add a new operator with their banking details for ACH payments."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Basic Information</h4>
                <FormField
                  control={form.control}
                  name="operatorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operator Name (Short Name)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., XTO Energy"
                          data-testid="input-operator-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="legalEntityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal Entity Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., XTO Energy Inc."
                          data-testid="input-legal-entity-name"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>The official legal name for banking purposes</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasAch"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-has-ach"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable ACH Payments</FormLabel>
                        <FormDescription>
                          Check this if the operator accepts ACH transfers
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {hasAch && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Banking Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., JPMorgan Chase"
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
                      name="bankAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Optional"
                              data-testid="input-bank-address"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="routingNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ACH Routing Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="9 digits"
                              maxLength={9}
                              data-testid="input-routing-number"
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
                      name="wireRouting"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wire Routing (if different)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Optional"
                              maxLength={9}
                              data-testid="input-wire-routing"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Account number"
                              data-testid="input-account-number"
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
                      name="swiftCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SWIFT Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Optional"
                              data-testid="input-swift-code"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="remittanceEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remittance Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="remittance@company.com"
                            data-testid="input-remittance-email"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Contact Information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Name"
                            data-testid="input-contact-name"
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
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Phone"
                            data-testid="input-contact-phone"
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
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email"
                            data-testid="input-contact-email"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes about this operator..."
                        data-testid="input-notes"
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-operator"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingOperator
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingOperator}
        onOpenChange={() => setDeletingOperator(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Operator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingOperator?.operatorName}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingOperator && deleteMutation.mutate(deletingOperator.id)
              }
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

function OperatorsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
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
