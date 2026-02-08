import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  CreditCard,
  ArrowRight,
  TrendingUp,
  FileText,
  Upload,
  Clock,
  Copy,
  Coins,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, formatCompactCurrency, formatDateTime } from "@/lib/format";

interface DashboardData {
  actionItems: {
    needsAttention: number;
    unknownOperators: number;
    missingOwnerNumbers: number;
    readyForAch: number;
    readyForAchAmount: number;
    availableCredits: number;
    creditOperators: number;
    pendingChecks: number;
    pendingChecksAmount: number;
    duplicatePayments: number;
    duplicatePaymentsAmount: number;
    paymentsWithCredits: number;
    paymentsWithCreditsAmount: number;
  };
  monthlySummary: {
    accountName: string;
    amount: number;
    count: number;
  }[];
  totalPaid: number;
  totalPayments: number;
  creditsUsed: number;
  creditApplications: number;
  trends: Record<string, string | number>[];
  accountPrefixes: string[];
  topOperators: {
    name: string;
    amount: number;
    count: number;
  }[];
  recentActivity: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
  }[];
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of payment operations and pending actions
        </p>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Action Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.actionItems.needsAttention > 0 && (
            <div className="flex items-center justify-between p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                <div>
                  <p className="font-medium text-foreground">
                    {data.actionItems.needsAttention} payments need attention
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.actionItems.unknownOperators} unknown operators, {data.actionItems.missingOwnerNumbers} missing owner number
                  </p>
                </div>
              </div>
              <Button size="sm" asChild data-testid="button-review-now">
                <Link href="/payments?status=attention">
                  Review Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          {data?.actionItems.readyForAch > 0 && (
            <div className="flex items-center justify-between p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                <div>
                  <p className="font-medium text-foreground">
                    {data.actionItems.readyForAch} payments ready for ACH ({formatCurrency(data.actionItems.readyForAchAmount)})
                  </p>
                </div>
              </div>
              <Button size="sm" asChild data-testid="button-generate-files">
                <Link href="/payments?status=ready">
                  Generate Files
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          {data?.actionItems.availableCredits > 0 && (
            <div className="flex items-center justify-between p-3 rounded-md bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-500" />
                <div>
                  <p className="font-medium text-foreground">
                    {formatCurrency(data.actionItems.availableCredits)} in credits available ({data.actionItems.creditOperators} operators)
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild data-testid="button-view-credits">
                <Link href="/credits">
                  View Credits
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          {data?.actionItems.pendingChecks > 0 && (
            <div className="flex items-center justify-between p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                <div>
                  <p className="font-medium text-foreground">
                    {data.actionItems.pendingChecks} check payments pending ({formatCurrency(data.actionItems.pendingChecksAmount)})
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild data-testid="button-process-checks">
                <Link href="/payments?method=check">
                  Process Checks
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          {data?.actionItems.duplicatePayments > 0 && (
            <div className="flex items-center justify-between p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-3">
                <Copy className="h-5 w-5 text-red-600 dark:text-red-500" />
                <div>
                  <p className="font-medium text-foreground">
                    {data.actionItems.duplicatePayments} potential duplicates detected ({formatCurrency(data.actionItems.duplicatePaymentsAmount)})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Review before processing to avoid double payments
                  </p>
                </div>
              </div>
              <Button size="sm" variant="destructive" asChild data-testid="button-review-duplicates">
                <Link href="/payments?filter=duplicates">
                  Review Duplicates
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          {data?.actionItems.paymentsWithCredits > 0 && (
            <div className="flex items-center justify-between p-3 rounded-md bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900">
              <div className="flex items-center gap-3">
                <Coins className="h-5 w-5 text-violet-600 dark:text-violet-500" />
                <div>
                  <p className="font-medium text-foreground">
                    {data.actionItems.paymentsWithCredits} payments have credits available ({formatCurrency(data.actionItems.paymentsWithCreditsAmount)})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Apply credits to reduce payment amounts
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild data-testid="button-apply-credits">
                <Link href="/payments?filter=credits">
                  Apply Credits
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              This Month Summary (January 2026)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.monthlySummary.map((account) => (
                <div key={account.accountName} className="flex items-center justify-between">
                  <span className="font-medium">{account.accountName}:</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(account.amount)} ({account.count} payments)
                  </span>
                </div>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between font-medium">
                  <span>Total Paid:</span>
                  <span>{formatCurrency(data?.totalPaid)} ({data?.totalPayments} payments)</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                  <span>Credits Used:</span>
                  <span>{formatCurrency(data?.creditsUsed)} ({data?.creditApplications} applications)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Operators */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Top 5 Operators (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Payments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.topOperators.map((op) => (
                  <TableRow key={op.name}>
                    <TableCell className="font-medium truncate max-w-[200px]">{op.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(op.amount)}</TableCell>
                    <TableCell className="text-right">{op.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Payment Trends Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Payment Trends (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-xs fill-muted-foreground"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tickFormatter={(value) => formatCompactCurrency(value)}
                  className="text-xs fill-muted-foreground"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                {(data?.accountPrefixes || []).map((prefix, index) => {
                  const colors = [
                    "hsl(217, 91%, 60%)",
                    "hsl(142, 71%, 45%)",
                    "hsl(37, 91%, 55%)",
                    "hsl(280, 65%, 60%)",
                    "hsl(350, 80%, 55%)",
                  ];
                  return (
                    <Line
                      key={prefix}
                      type="monotone"
                      dataKey={prefix}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ fill: colors[index % colors.length] }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 text-sm"
              >
                <span className="text-muted-foreground whitespace-nowrap w-[140px]">
                  {formatDateTime(activity.createdAt)}
                </span>
                <div className="flex items-center gap-2">
                  {activity.action === "import" && <Upload className="h-4 w-4 text-muted-foreground" />}
                  {activity.action === "generate" && <FileText className="h-4 w-4 text-muted-foreground" />}
                  {activity.action === "process" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  {activity.action === "credit" && <DollarSign className="h-4 w-4 text-violet-600" />}
                  <span>{activity.description}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
