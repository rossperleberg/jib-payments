import {
  type User, type InsertUser,
  type Account, type InsertAccount,
  type Operator, type InsertOperator,
  type Payment, type InsertPayment,
  type Credit, type InsertCredit,
  type AchBatch, type InsertAchBatch,
  type ActivityLog, type InsertActivityLog,
  users, accounts, operators, payments, credits, achBatches, activityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Accounts
  getAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: string): Promise<boolean>;

  // Operators
  getOperators(): Promise<Operator[]>;
  getOperator(id: string): Promise<Operator | undefined>;
  createOperator(operator: InsertOperator): Promise<Operator>;
  updateOperator(id: string, updates: Partial<InsertOperator>): Promise<Operator | undefined>;
  deleteOperator(id: string): Promise<boolean>;

  // Payments
  getPayments(filters?: { status?: string; accountId?: string; batchId?: string }): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: string): Promise<boolean>;

  // Credits
  getCredits(): Promise<Credit[]>;
  getCredit(id: string): Promise<Credit | undefined>;
  createCredit(credit: InsertCredit): Promise<Credit>;
  updateCredit(id: string, updates: Partial<InsertCredit>): Promise<Credit | undefined>;
  deleteCredit(id: string): Promise<boolean>;

  // ACH Batches
  getBatches(): Promise<AchBatch[]>;
  getBatch(id: string): Promise<AchBatch | undefined>;
  createBatch(batch: InsertAchBatch): Promise<AchBatch>;
  deleteBatch(id: string): Promise<boolean>;

  // Activity Log
  getActivityLog(limit?: number): Promise<ActivityLog[]>;
  createActivity(activity: InsertActivityLog): Promise<ActivityLog>;

  // Dashboard
  getDashboardData(): Promise<any>;

  // Seed initial data
  seedInitialData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts);
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    const [updated] = await db.update(accounts).set(updates).where(eq(accounts.id, id)).returning();
    return updated || undefined;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const result = await db.delete(accounts).where(eq(accounts.id, id)).returning();
    return result.length > 0;
  }

  // Operators
  async getOperators(): Promise<Operator[]> {
    return await db.select().from(operators);
  }

  async getOperator(id: string): Promise<Operator | undefined> {
    const [operator] = await db.select().from(operators).where(eq(operators.id, id));
    return operator || undefined;
  }

  async createOperator(operator: InsertOperator): Promise<Operator> {
    const [newOperator] = await db.insert(operators).values(operator).returning();
    return newOperator;
  }

  async updateOperator(id: string, updates: Partial<InsertOperator>): Promise<Operator | undefined> {
    const [updated] = await db.update(operators).set(updates).where(eq(operators.id, id)).returning();
    return updated || undefined;
  }

  async deleteOperator(id: string): Promise<boolean> {
    const result = await db.delete(operators).where(eq(operators.id, id)).returning();
    return result.length > 0;
  }

  // Payments
  async getPayments(filters?: { status?: string; accountId?: string; batchId?: string }): Promise<Payment[]> {
    let query = db.select().from(payments);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(payments.status, filters.status));
    }
    if (filters?.accountId) {
      conditions.push(eq(payments.accountId, filters.accountId));
    }
    if (filters?.batchId) {
      conditions.push(eq(payments.batchId, filters.batchId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(payments).where(and(...conditions)).orderBy(desc(payments.paymentDate));
    }
    return await db.select().from(payments).orderBy(desc(payments.paymentDate));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updated] = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
    return updated || undefined;
  }

  async deletePayment(id: string): Promise<boolean> {
    const result = await db.delete(payments).where(eq(payments.id, id)).returning();
    return result.length > 0;
  }

  // Credits
  async getCredits(): Promise<Credit[]> {
    return await db.select().from(credits);
  }

  async getCredit(id: string): Promise<Credit | undefined> {
    const [credit] = await db.select().from(credits).where(eq(credits.id, id));
    return credit || undefined;
  }

  async createCredit(credit: InsertCredit): Promise<Credit> {
    const [newCredit] = await db.insert(credits).values(credit).returning();
    return newCredit;
  }

  async updateCredit(id: string, updates: Partial<InsertCredit>): Promise<Credit | undefined> {
    const [updated] = await db.update(credits).set(updates).where(eq(credits.id, id)).returning();
    return updated || undefined;
  }

  async deleteCredit(id: string): Promise<boolean> {
    const result = await db.delete(credits).where(eq(credits.id, id)).returning();
    return result.length > 0;
  }

  // ACH Batches
  async getBatches(): Promise<AchBatch[]> {
    return await db.select().from(achBatches).orderBy(desc(achBatches.generatedDate));
  }

  async getBatch(id: string): Promise<AchBatch | undefined> {
    const [batch] = await db.select().from(achBatches).where(eq(achBatches.id, id));
    return batch || undefined;
  }

  async createBatch(batch: InsertAchBatch): Promise<AchBatch> {
    const [newBatch] = await db.insert(achBatches).values(batch).returning();
    return newBatch;
  }

  async deleteBatch(id: string): Promise<boolean> {
    const result = await db.delete(achBatches).where(eq(achBatches.id, id)).returning();
    return result.length > 0;
  }

  // Activity Log
  async getActivityLog(limit: number = 10): Promise<ActivityLog[]> {
    return await db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit);
  }

  async createActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const [newActivity] = await db.insert(activityLog).values(activity).returning();
    return newActivity;
  }

  // Dashboard
  async getDashboardData(): Promise<any> {
    const allPayments = await this.getPayments();
    const allCredits = await this.getCredits();
    const allAccounts = await this.getAccounts();
    const activities = await this.getActivityLog(5);

    // Calculate action items
    const needsAttention = allPayments.filter(p => p.status === "pending" || p.status === "failed");
    const unknownOperators = allPayments.filter(p => !p.operatorId && p.status === "pending");
    const missingOwnerNumbers = allPayments.filter(p => !p.ownerNumber && p.status === "pending");
    const readyForAch = allPayments.filter(p => p.status === "ready" && p.paymentMethod === "ACH");
    const pendingChecks = allPayments.filter(p => p.status === "ready" && p.paymentMethod === "Check");
    const billPayPayments = allPayments.filter(p => p.status === "in_bill_pay");
    const entryTrackerPayments = allPayments.filter(p => p.status === "in_entry_tracker");
    const activeCredits = allCredits.filter(c => c.isActive);
    const duplicatePayments = allPayments.filter(p => p.isPotentialDuplicate && (p.status === "pending" || p.status === "ready"));
    const paymentsWithCredits = allPayments.filter(p => p.hasAvailableCredit && (p.status === "pending" || p.status === "ready"));

    // Monthly summary
    const monthlySummary = allAccounts.map(acc => {
      const accPayments = allPayments.filter(p => p.accountId === acc.id && p.status === "processed");
      return {
        accountName: acc.accountPrefix,
        amount: accPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        count: accPayments.length,
      };
    });

    // Top operators
    const operatorTotals = new Map<string, { name: string; amount: number; count: number }>();
    allPayments.forEach(p => {
      if (p.status === "processed" || p.status === "ready") {
        const current = operatorTotals.get(p.operatorName) || { name: p.operatorName, amount: 0, count: 0 };
        current.amount += Number(p.amount);
        current.count += 1;
        operatorTotals.set(p.operatorName, current);
      }
    });
    const topOperators = Array.from(operatorTotals.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Payment trends calculated from actual payment data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const accountPrefixes = allAccounts.map(a => a.accountPrefix);
    
    // Get last 6 months
    const now = new Date();
    const last6Months: { month: string; year: number; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        key: `${d.getFullYear()}-${d.getMonth()}`,
      });
    }
    
    // Calculate trends from actual payments (processed or ready)
    const trendData = new Map<string, Record<string, number>>();
    last6Months.forEach(m => {
      const record: Record<string, number> = { month: m.month as any };
      accountPrefixes.forEach(prefix => {
        record[prefix] = 0;
      });
      trendData.set(m.key, record);
    });
    
    allPayments.forEach(p => {
      if (p.status === "processed" || p.status === "ready" || p.status === "in_entry_tracker" || p.status === "in_bill_pay") {
        const paymentDate = new Date(p.paymentDate || p.createdAt || new Date());
        const key = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;
        const monthData = trendData.get(key);
        if (monthData) {
          const account = allAccounts.find(a => a.id === p.accountId);
          if (account) {
            monthData[account.accountPrefix] = (monthData[account.accountPrefix] || 0) + Number(p.amount);
          }
        }
      }
    });
    
    const trends = last6Months.map(m => {
      const data = trendData.get(m.key);
      if (data) {
        return data;
      }
      return { month: m.month };
    });

    return {
      actionItems: {
        needsAttention: needsAttention.length,
        unknownOperators: unknownOperators.length,
        missingOwnerNumbers: missingOwnerNumbers.length,
        readyForAch: readyForAch.length,
        readyForAchAmount: readyForAch.reduce((sum, p) => sum + Number(p.amount), 0),
        availableCredits: activeCredits.reduce((sum, c) => sum + Number(c.remainingBalance), 0),
        creditOperators: new Set(activeCredits.map(c => c.operatorId)).size,
        pendingChecks: pendingChecks.length,
        pendingChecksAmount: pendingChecks.reduce((sum, p) => sum + Number(p.amount), 0),
        billPayPayments: billPayPayments.length,
        billPayPaymentsAmount: billPayPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        entryTrackerPayments: entryTrackerPayments.length,
        entryTrackerPaymentsAmount: entryTrackerPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        duplicatePayments: duplicatePayments.length,
        duplicatePaymentsAmount: duplicatePayments.reduce((sum, p) => sum + Number(p.amount), 0),
        paymentsWithCredits: paymentsWithCredits.length,
        paymentsWithCreditsAmount: paymentsWithCredits.reduce((sum, p) => sum + Number(p.amount), 0),
      },
      monthlySummary,
      totalPaid: allPayments.filter(p => p.status === "processed").reduce((sum, p) => sum + Number(p.amount), 0),
      totalPayments: allPayments.filter(p => p.status === "processed").length,
      creditsUsed: allCredits.reduce((sum, c) => sum + (Number(c.originalAmount) - Number(c.remainingBalance)), 0),
      creditApplications: 5,
      trends,
      accountPrefixes,
      topOperators,
      recentActivity: activities,
    };
  }

  // Seed initial data if database is empty
  async seedInitialData(): Promise<void> {
    // Check if accounts exist
    const existingAccounts = await this.getAccounts();
    if (existingAccounts.length > 0) {
      return; // Database already has data
    }

    // Seed accounts
    const accountsData: InsertAccount[] = [
      { accountName: "GPG, Inc.", accountPrefix: "GPG", bankName: "Western State Bank", currentCheckNumber: 1005 },
      { accountName: "Western Energy Corp", accountPrefix: "WEC", bankName: "Western State Bank", currentCheckNumber: 1000 },
      { accountName: "GROW Minerals", accountPrefix: "GROW", bankName: "Western State Bank", currentCheckNumber: 1000 },
    ];
    
    for (const account of accountsData) {
      await this.createAccount(account);
    }

    // Seed operators
    const operatorsData: InsertOperator[] = [
      { operatorName: "Chord/Enerplus", legalEntityName: "Enerplus Resources (USA) Corporation", aliases: ["ENERPLUS RESOURCES", "ENERPLUS RESOURCES (USA) CORPORATION", "ENERPLUS", "ENERPLUS RESOURCES USA"], hasAch: true, bankName: "JPMorgan Chase", routingNumber: "111000614", accountNumber: "682587129", wireRouting: "021000021", achAddedBy: "admin" },
      { operatorName: "Chord/Oasis", legalEntityName: "Oasis Petroleum North America LLC", aliases: ["OASIS PETROLEUM", "OASIS PETROLEUM NORTH AMERICA", "OASIS PETROLEUM NORTH AMERICA LLC", "OASIS"], hasAch: true, bankName: "JP Morgan Chase", routingNumber: "111000614", accountNumber: "747479327", wireRouting: "021000021", achAddedBy: "admin" },
      { operatorName: "Chord/Whiting", legalEntityName: "Whiting Oil & Gas Corp.", aliases: ["WHITING OIL AND GAS", "WHITING OIL & GAS", "WHITING OIL AND GAS CORPORATION", "WHITING PETROLEUM", "WHITING"], hasAch: true, bankName: "JP Morgan Chase", routingNumber: "102001017", accountNumber: "192493417", wireRouting: "021000021", notes: "Different ACH routing!", achAddedBy: "admin" },
      { operatorName: "ConocoPhillips", legalEntityName: "ConocoPhillips Company", aliases: ["COP", "COP ON BEHALF", "COP ON BEHALF-MARATHON", "COP ON BEHALF-BURL", "COP ON BEHALF-BURLINGTON", "MARATHON", "MARATHON OIL", "BURLINGTON RESOURCES", "CONOCOPHILLIPS COMPANY"], hasAch: true, bankName: "JP Morgan Chase", bankAddress: "270 Park Ave, New York, NY 10017", routingNumber: "071000013", accountNumber: "643625262", wireRouting: "021000021", remittanceEmail: "rsc.ar.cash@conocophillips.com", notes: "Effective July 1, 2025 (Marathon acquisition)", achAddedBy: "admin" },
      { operatorName: "Continental Resources", legalEntityName: "Continental Resources, Inc. Operating Account", hasAch: true, bankName: "US Bank", bankAddress: "950 17th St., Denver, CO 80202", routingNumber: "102000021", accountNumber: "103690174968", wireRouting: "102000021", swiftCode: "USBKUS44IMT", remittanceEmail: "pmtremittance@clr.com", contactName: "Fonette Hedrick", contactPhone: "405-234-9528", contactEmail: "Fonette.Hedrick@clr.com", notes: "PO Box 268835, Oklahoma City, OK 73126", achAddedBy: "admin" },
      { operatorName: "Formentera Operations", legalEntityName: "Formentera Operations LLC", hasAch: true, bankName: "Frost Bank", routingNumber: "114000093", accountNumber: "578895031", contactName: "Jack Herndon (SVP)", contactPhone: "432-617-1316", achAddedBy: "admin" },
      { operatorName: "Foundation Energy", legalEntityName: "Foundation Energy Management, LLC", hasAch: true, bankName: "Amegy Bank", bankAddress: "2501 N Harwood St, 16th Floor, Dallas, TX 75201", routingNumber: "113011258", accountNumber: "51583697", wireRouting: "113011258", contactName: "JB Askew (SVP)", notes: "PO Box 650696, Dallas, TX 75265-0696", achAddedBy: "admin" },
      { operatorName: "Hess Bakken", legalEntityName: "Hess Bakken Investment II LLC", hasAch: true, bankName: "JPMorgan Chase Bank", bankAddress: "One Chase Manhattan Plaza, New York, NY 10081", routingNumber: "021000021", accountNumber: "486301224", wireRouting: "021000021", swiftCode: "CHASUS33", achAddedBy: "admin" },
      { operatorName: "Hunt Oil", legalEntityName: "HUNT OIL COMPANY", aliases: ["HUNT OIL COMPANY", "HUNT OIL CO", "HUNT"], hasAch: true, bankName: "Bank of America", bankAddress: "1900 N AKARD ST, DALLAS, TX 75201", routingNumber: "111000012", accountNumber: "000180001230", wireRouting: "026009593", swiftCode: "BOFAUS3N/BOFAUS6S", contactName: "Natalie Reynolds", contactPhone: "888.400.9009", notes: "Has active ACH blocks/filters", achAddedBy: "admin" },
      { operatorName: "KODA Resources", legalEntityName: "KODA Resources Operating, LLC", hasAch: true, bankName: "Capital One, N.A.", bankAddress: "Houston, TX", routingNumber: "111901014", accountNumber: "3746652652", wireRouting: "111901014", swiftCode: "HIBKUS44", contactName: "Tony Queen", contactPhone: "(469) 331-6617", contactEmail: "EnergyClientService@capitalone.com", notes: "1401 Wynkoop St, Suite 300, Denver, CO 80202", achAddedBy: "admin" },
      { operatorName: "Kraken Operating", legalEntityName: "Kraken Operating LLC", hasAch: true, bankName: "Texas Capital Bank, N.A.", bankAddress: "2000 McKinney Ave, Dallas, TX 75201", routingNumber: "111017979", accountNumber: "2400001425", contactName: "Cheresa Hogan (AVP)", contactPhone: "346-542-4928", contactEmail: "cheresa.hogan@texascapitalbank.com", achAddedBy: "admin" },
      { operatorName: "Lime Rock Resources", legalEntityName: "LIME ROCK RESOURCES OPERATING COMPANY", hasAch: true, bankName: "Amegy Bank (Zions)", routingNumber: "113011258", accountNumber: "0053268195", swiftCode: "ZFNBUS55", contactName: "April Saldivar", contactPhone: "1-888-539-7928", contactEmail: "tmclientservices@amegybank.com", notes: "1111 Bagby St Suite 4600, Houston TX 77002-2559", achAddedBy: "admin" },
      { operatorName: "Murex Petroleum", legalEntityName: "Murex Petroleum Corporation", aliases: ["MUREX PETROLEUM CORPORATION", "MUREX PETROLEUM CORP", "MUREX"], hasAch: true, bankName: "US Bank", bankAddress: "120 W 12th St, Suite 105, Kansas City, MO 64105", routingNumber: "102000021", accountNumber: "103690310018", contactName: "Kathy Machado", contactPhone: "281.590.3313", contactEmail: "kmachado@murexpetroleum.com", notes: "1700 City Plaza Dr., Suite 575, Spring, TX 77389", achAddedBy: "admin" },
      { operatorName: "Red Rock Resources", legalEntityName: "Red Rock Resources Corporation Operating Account", hasAch: true, bankName: "Frost Bank", bankAddress: "111 W. Houston St. San Antonio, TX 78205", routingNumber: "114000093", accountNumber: "579215883", swiftCode: "FRSTUS44", contactName: "Ileana Moralez", contactPhone: "(432) 617-1309", contactEmail: "ileana.moralez@frostbank.com", notes: "8101 E Prentice Ave Ste 725, Greenwood Village CO 80111", achAddedBy: "admin" },
      { operatorName: "Rockport Oil & Gas", legalEntityName: "Rockport Oil & Gas IV LLC", hasAch: true, bankName: "Bank of America", routingNumber: "111000012", accountNumber: "4451804502", contactEmail: "bryan.phiffer@plantemoran.com", achAddedBy: "admin" },
      { operatorName: "Silver Hill Energy", legalEntityName: "Silver Hill Energy Operating LLC", hasAch: true, bankName: "Bank of Texas NA", routingNumber: "111014325", accountNumber: "8097566224", remittanceEmail: "ownerrelations@silverhillenergy.com", contactName: "Shannan", contactEmail: "OwnerRelations@SilverHillEnergy.com", achAddedBy: "admin" },
      { operatorName: "Slawson Exploration", legalEntityName: "Slawson Exploration Co., Inc. - Operating", hasAch: true, bankName: "Intrust Bank", bankAddress: "Wichita, KS", routingNumber: "101100029", accountNumber: "41472381", wireRouting: "101100029", contactName: "Cindy", contactPhone: "(405) 478-7412", contactEmail: "chowell@slawson.com", notes: "Same routing for ACH and Wire", achAddedBy: "admin" },
      { operatorName: "XTO Energy", legalEntityName: "XTO Energy Inc.", hasAch: true, bankName: "Citibank, N.A.", routingNumber: "021000089", accountNumber: "30956943", wireRouting: "021000089", swiftCode: "CITIUS33", contactName: "Julio Cesar Xavier Guerios", contactPhone: "+1 (346) 335-6919", contactEmail: "julio.c.guerios@exxonmobil.com", notes: "Tax ID: 75-2847769", achAddedBy: "admin" },
      { operatorName: "Zavanna Energy", legalEntityName: "Zavanna Energy Operating Drilling Account", hasAch: true, bankName: "Comerica Bank", routingNumber: "111000753", accountNumber: "1883565440", contactPhone: "303-595-8004", notes: "Wire instructions", achAddedBy: "admin" },
      { operatorName: "Devon Energy", legalEntityName: "Devon Energy Production Company", hasAch: true, bankName: "Bank of America, N.A.", bankAddress: "901 Main Street, Dallas, TX 75202", routingNumber: "026009593", accountNumber: "4451454159", notes: "Also known as Devon Energy Williston, LLC per invoice", achAddedBy: "admin" },
      { operatorName: "EOG Resources", legalEntityName: "EOG Resources, Inc.", hasAch: true, bankName: "Bank of America, N.A.", bankAddress: "901 Main Street, Dallas, TX 75202", routingNumber: "111000012", accountNumber: "3750494413", notes: "1111 Bagby, Sky Lobby 2, Houston, TX 77002 | PO Box 4362, Houston, TX 77210-4362", achAddedBy: "admin" },
      { operatorName: "Phoenix Operating", legalEntityName: "Phoenix Operating LLC", hasAch: true, bankName: "Amarillo National Bank", bankAddress: "410 South Taylor Street, Amarillo, TX 79101", routingNumber: "111300958", accountNumber: "322334", notes: "4643 S. Ulster Street Ste. 1510, Denver, CO 80237", achAddedBy: "admin" },
      { operatorName: "Petro-Hunt", legalEntityName: "Petro-Hunt, L.L.C.", aliases: ["PETRO-HUNT LLC", "PETRO-HUNT L.L.C.", "PETROHUNT", "PETRO HUNT"], hasAch: true, bankName: "Bank of Texas, N.A.", bankAddress: "Dallas, TX", routingNumber: "111014325", accountNumber: "8094647720", contactName: "J.M. Mason", contactPhone: "214-880-8400", notes: "Rosewood Court, 2101 Cedar Springs Road, Suite 600, Dallas, TX 75201 | Fax: 214-880-7171", achAddedBy: "admin" },
    ];
    
    for (const operator of operatorsData) {
      await this.createOperator(operator);
    }

    console.log("Database seeded with initial accounts and operators");
  }
}

export const storage = new DatabaseStorage();
