import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Account } from "@shared/schema";

interface ImportResult {
  total: number;
  readyForAch: number;
  unknownOperators: number;
  markedForCheck: number;
  possibleDuplicates: number;
  withAvailableCredits: number;
}

export default function Import() {
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".csv"))) {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel (.xlsx) or CSV file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedAccount || !selectedFile) {
      toast({
        title: "Missing information",
        description: "Please select an account and upload a file",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("accountId", selectedAccount);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      setImportResult({
        total: data.total,
        readyForAch: data.readyForAch,
        unknownOperators: data.unknownOperators,
        markedForCheck: data.markedForCheck,
        possibleDuplicates: data.possibleDuplicates || 0,
        withAvailableCredits: data.withAvailableCredits || 0,
      });

      // Invalidate payments and dashboard queries so new data shows up
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });

      toast({ 
        title: "Import completed successfully",
        description: `Imported ${data.total} payments (${data.readyForAch} ready for ACH)`
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Could not process the file",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportResult(null);
  };

  if (isLoading) {
    return <ImportSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">JIB Import</h1>
        <p className="text-muted-foreground mt-1">
          Upload JIB statements to import payment records
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            Import JIB Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select Account */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Step 1: Select Account</label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-full" data-testid="select-import-account">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.accountName} ({account.accountPrefix})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Upload File */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Step 2: Upload File</label>
            <p className="text-sm text-muted-foreground">
              Expected format: Excel (.xlsx) from Bakken Clarity
            </p>
            <p className="text-xs text-muted-foreground">
              Required columns: amtOriginal, docNum, opOwnerNum, operator, receivedDateObj
            </p>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="ml-4"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm mb-2">
                    Drag and drop your file here, or{" "}
                    <label className="text-primary cursor-pointer hover:underline">
                      browse
                      <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,.csv"
                        onChange={handleFileChange}
                        data-testid="input-file-upload"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports .xlsx and .csv files
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={resetImport}
              disabled={!selectedFile}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedAccount || !selectedFile || isImporting}
              data-testid="button-import"
            >
              {isImporting ? (
                <>
                  <span className="animate-spin mr-2">
                    <Upload className="h-4 w-4" />
                  </span>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import to Pending
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Imports */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No recent imports</p>
            <p className="text-xs text-muted-foreground mt-1">
              Import history will appear here
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Import Result Dialog */}
      <Dialog open={!!importResult} onOpenChange={() => setImportResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Import Complete
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-md bg-muted">
                <p className="text-sm text-muted-foreground">Total Imported</p>
                <p className="text-2xl font-semibold">{importResult?.total}</p>
              </div>
              <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                <p className="text-sm text-muted-foreground">Ready for ACH</p>
                <p className="text-2xl font-semibold text-emerald-600">
                  {importResult?.readyForAch}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {importResult && importResult.unknownOperators > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  {importResult.unknownOperators} unknown operators need mapping
                </div>
              )}
              {importResult && importResult.markedForCheck > 0 && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {importResult.markedForCheck} marked for check (no ACH)
                </div>
              )}
              {importResult && importResult.possibleDuplicates > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  {importResult.possibleDuplicates} possible duplicates detected - review carefully
                </div>
              )}
              {importResult && importResult.withAvailableCredits > 0 && (
                <div className="flex items-center gap-2 text-sm text-violet-600">
                  <DollarSign className="h-4 w-4" />
                  {importResult.withAvailableCredits} payments have credits available
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button asChild data-testid="button-view-pending">
              <Link href="/payments">
                View Pending Payments
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImportSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
