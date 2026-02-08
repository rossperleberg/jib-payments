import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, CreditCard, Save, RefreshCw, Info, Users, X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Account, Operator } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [newAlias, setNewAlias] = useState<Record<string, string>>({});

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: operators, isLoading: operatorsLoading } = useQuery<Operator[]>({
    queryKey: ["/api/operators"],
  });

  const updateOperatorAliasMutation = useMutation({
    mutationFn: async ({ operatorId, aliases }: { operatorId: string; aliases: string[] }) => {
      return apiRequest("PATCH", `/api/operators/${operatorId}`, { aliases });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operators"] });
      toast({ title: "Aliases updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update aliases", variant: "destructive" });
    },
  });

  const handleAddAlias = (operator: Operator) => {
    const aliasToAdd = newAlias[operator.id]?.trim();
    if (!aliasToAdd) return;
    
    const currentAliases = operator.aliases || [];
    if (currentAliases.includes(aliasToAdd)) {
      toast({ title: "This alias already exists", variant: "destructive" });
      return;
    }
    
    updateOperatorAliasMutation.mutate({
      operatorId: operator.id,
      aliases: [...currentAliases, aliasToAdd],
    });
    setNewAlias((prev) => ({ ...prev, [operator.id]: "" }));
  };

  const handleRemoveAlias = (operator: Operator, aliasToRemove: string) => {
    const currentAliases = operator.aliases || [];
    updateOperatorAliasMutation.mutate({
      operatorId: operator.id,
      aliases: currentAliases.filter((a) => a !== aliasToRemove),
    });
  };

  const account = accounts?.find((a) => a.id === selectedAccount);

  const updateCheckNumberMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/accounts/${selectedAccount}`, {
        currentCheckNumber: parseInt(checkNumber),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "Check number updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update check number", variant: "destructive" });
    },
  });

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    const acc = accounts?.find((a) => a.id === accountId);
    setCheckNumber(acc?.currentCheckNumber?.toString() || "1000");
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure account settings and preferences
        </p>
      </div>

      {/* Check Payment Configuration */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            Check Payment Configuration
          </CardTitle>
          <CardDescription>
            Manage check numbering for each account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Account</Label>
            <Select value={selectedAccount} onValueChange={handleAccountChange}>
              <SelectTrigger data-testid="select-settings-account">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.accountName} ({acc.accountPrefix})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAccount && account && (
            <>
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Current Check Number:
                  </span>
                  <Badge variant="secondary" className="font-mono">
                    #{account.currentCheckNumber}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  This is the next check number that will be assigned when processing check payments.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkNumber">Update Check Number</Label>
                <div className="flex gap-3">
                  <Input
                    id="checkNumber"
                    type="number"
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                    placeholder="Enter new check number"
                    className="max-w-[200px]"
                    data-testid="input-new-check-number"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setCheckNumber("1000")}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to 1000
                  </Button>
                  <Button
                    onClick={() => updateCheckNumberMutation.mutate()}
                    disabled={updateCheckNumberMutation.isPending || !checkNumber}
                    data-testid="button-save-check-number"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Remittance Format */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Remittance Format
          </CardTitle>
          <CardDescription>
            Configure how remittance information appears on ACH payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Format Template</span>
            </div>
            <code className="block p-2 rounded bg-background font-mono text-sm">
              {"{prefix}-{owner_number} {period}"}
            </code>
            <p className="text-sm text-muted-foreground">
              Preview: <span className="font-mono">GPG-GPG001 JAN2026</span>
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Available Variables</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded bg-muted/50">
                <code className="font-mono text-xs">{"{prefix}"}</code>
                <p className="text-muted-foreground">Account prefix (e.g., "GPG-")</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <code className="font-mono text-xs">{"{owner_number}"}</code>
                <p className="text-muted-foreground">Owner number for the payment</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <code className="font-mono text-xs">{"{period}"}</code>
                <p className="text-muted-foreground">Payment period (e.g., "JAN2026")</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <code className="font-mono text-xs">{"{doc_num}"}</code>
                <p className="text-muted-foreground">Document/Invoice number</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Integration */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-medium">Bank Integration</CardTitle>
          <CardDescription>
            Western State Bank ACH integration settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Western State Bank</p>
                <p className="text-sm text-muted-foreground">
                  ACH file format: CSV (compatible with WSB File Import)
                </p>
              </div>
              <Badge variant="outline" className="gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Connected
              </Badge>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Daily ACH Limit
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Western State Bank has a daily ACH limit of $500,000. Batches exceeding
                    this amount should be split across multiple days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operator Alias Management */}
      <Card data-testid="card-operator-alias-management">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2" data-testid="title-operator-alias-management">
            <Users className="h-5 w-5 text-muted-foreground" />
            Operator Alias Management
          </CardTitle>
          <CardDescription data-testid="description-operator-alias-management">
            Manage name aliases for automatic operator matching during imports. Aliases are learned when you manually assign operators to imported payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {operatorsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border" data-testid="table-operator-aliases-wrapper">
              <Table data-testid="table-operator-aliases">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]" data-testid="header-operator-name">Operator Name</TableHead>
                    <TableHead data-testid="header-aliases">Aliases (for Import Matching)</TableHead>
                    <TableHead className="w-[200px]" data-testid="header-add-alias">Add Alias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operators?.map((operator) => (
                    <TableRow key={operator.id} data-testid={`row-operator-alias-${operator.id}`}>
                      <TableCell className="font-medium">
                        <span data-testid={`text-operator-name-${operator.id}`}>{operator.operatorName}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2" data-testid={`container-aliases-${operator.id}`}>
                          {operator.aliases && operator.aliases.length > 0 ? (
                            operator.aliases.map((alias, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="gap-1"
                                data-testid={`badge-alias-${operator.id}-${idx}`}
                              >
                                <span data-testid={`text-alias-${operator.id}-${idx}`}>{alias}</span>
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => !updateOperatorAliasMutation.isPending && handleRemoveAlias(operator, alias)}
                                  data-testid={`button-remove-alias-${operator.id}-${idx}`}
                                />
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground" data-testid={`text-no-aliases-${operator.id}`}>No aliases</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Input
                            placeholder="New alias..."
                            value={newAlias[operator.id] || ""}
                            onChange={(e) =>
                              setNewAlias((prev) => ({
                                ...prev,
                                [operator.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddAlias(operator);
                              }
                            }}
                            disabled={updateOperatorAliasMutation.isPending}
                            data-testid={`input-new-alias-${operator.id}`}
                          />
                          <Button
                            variant="outline"
                            onClick={() => handleAddAlias(operator)}
                            disabled={!newAlias[operator.id]?.trim() || updateOperatorAliasMutation.isPending}
                            data-testid={`button-add-alias-${operator.id}`}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
