import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertAccountSchema,
  insertOperatorSchema,
  insertPaymentSchema,
  insertCreditSchema,
  insertAchBatchSchema,
  insertActivityLogSchema,
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import * as XLSX from "xlsx";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Dashboard
  app.get("/api/dashboard", async (req, res) => {
    try {
      const data = await storage.getDashboardData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Accounts
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const account = await storage.getAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch account" });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const validated = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(validated);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.patch("/api/accounts/:id", async (req, res) => {
    try {
      const validated = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(req.params.id, validated);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update account" });
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAccount(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Operators
  app.get("/api/operators", async (req, res) => {
    try {
      const operators = await storage.getOperators();
      res.json(operators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch operators" });
    }
  });

  app.get("/api/operators/:id", async (req, res) => {
    try {
      const operator = await storage.getOperator(req.params.id);
      if (!operator) {
        return res.status(404).json({ error: "Operator not found" });
      }
      res.json(operator);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch operator" });
    }
  });

  app.post("/api/operators", async (req, res) => {
    try {
      const validated = insertOperatorSchema.parse(req.body);
      const operator = await storage.createOperator(validated);
      res.status(201).json(operator);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create operator" });
    }
  });

  app.patch("/api/operators/:id", async (req, res) => {
    try {
      const validated = insertOperatorSchema.partial().parse(req.body);
      const operator = await storage.updateOperator(req.params.id, validated);
      if (!operator) {
        return res.status(404).json({ error: "Operator not found" });
      }
      res.json(operator);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update operator" });
    }
  });

  app.delete("/api/operators/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteOperator(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Operator not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete operator" });
    }
  });

  // Payments
  app.get("/api/payments", async (req, res) => {
    try {
      const { status, accountId } = req.query;
      const payments = await storage.getPayments({
        status: status as string | undefined,
        accountId: accountId as string | undefined,
      });
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/:id", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validated = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validated);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.patch("/api/payments/:id", async (req, res) => {
    try {
      // Preprocess date fields - convert ISO strings to Date objects or null
      const body = { ...req.body };
      if (body.entryEditedAt !== undefined) {
        body.entryEditedAt = body.entryEditedAt ? new Date(body.entryEditedAt) : null;
      }
      if (body.entrySentAt !== undefined) {
        body.entrySentAt = body.entrySentAt ? new Date(body.entrySentAt) : null;
      }
      if (body.importDate !== undefined) {
        body.importDate = body.importDate ? new Date(body.importDate) : null;
      }
      
      const validated = insertPaymentSchema.partial().parse(body);
      const payment = await storage.updatePayment(req.params.id, validated);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update payment" });
    }
  });

  app.delete("/api/payments/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePayment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });

  // Bulk delete payments
  app.post("/api/payments/bulk-delete", async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "ids array is required" });
      }
      let deletedCount = 0;
      for (const id of ids) {
        const deleted = await storage.deletePayment(id);
        if (deleted) deletedCount++;
      }
      res.json({ deleted: deletedCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payments" });
    }
  });

  // Credits
  app.get("/api/credits", async (req, res) => {
    try {
      const credits = await storage.getCredits();
      res.json(credits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch credits" });
    }
  });

  app.get("/api/credits/:id", async (req, res) => {
    try {
      const credit = await storage.getCredit(req.params.id);
      if (!credit) {
        return res.status(404).json({ error: "Credit not found" });
      }
      res.json(credit);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch credit" });
    }
  });

  app.post("/api/credits", async (req, res) => {
    try {
      const validated = insertCreditSchema.parse(req.body);
      const credit = await storage.createCredit(validated);
      res.status(201).json(credit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create credit" });
    }
  });

  app.patch("/api/credits/:id", async (req, res) => {
    try {
      const validated = insertCreditSchema.partial().parse(req.body);
      const credit = await storage.updateCredit(req.params.id, validated);
      if (!credit) {
        return res.status(404).json({ error: "Credit not found" });
      }
      res.json(credit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update credit" });
    }
  });

  app.delete("/api/credits/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCredit(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Credit not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete credit" });
    }
  });

  // ACH Batches
  app.get("/api/batches", async (req, res) => {
    try {
      const batches = await storage.getBatches();
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  app.post("/api/batches", async (req, res) => {
    try {
      const validated = insertAchBatchSchema.parse(req.body);
      const batch = await storage.createBatch(validated);
      res.status(201).json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  app.delete("/api/batches/:id", async (req, res) => {
    try {
      const batchId = req.params.id;
      const batch = await storage.getBatch(batchId);
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      // Move all payments in this batch back to ready status
      const payments = await storage.getPayments({ batchId });
      for (const payment of payments) {
        await storage.updatePayment(payment.id, {
          status: "ready",
          batchId: null,
          batchName: null,
        });
      }

      // Delete the batch
      await storage.deleteBatch(batchId);

      // Log activity
      await storage.createActivity({
        action: "batch_deleted",
        description: `Deleted batch ${batch.batchName} with ${payments.length} payments`,
        accountId: batch.accountId,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Delete batch error:", error);
      res.status(500).json({ error: "Failed to delete batch" });
    }
  });

  // Regenerate/redownload ACH file for existing batch
  app.get("/api/batches/:id/download", async (req, res) => {
    try {
      const batchId = req.params.id;
      const batch = await storage.getBatch(batchId);
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      // Get payments in this batch
      const payments = await storage.getPayments({ batchId });
      if (payments.length === 0) {
        return res.status(400).json({ error: "No payments in this batch" });
      }

      // Get operators and accounts for banking info
      const operators = await storage.getOperators();
      const accounts = await storage.getAccounts();

      // Validate routing numbers before generating
      const validationErrors: string[] = [];
      for (const payment of payments) {
        const operator = operators.find((o) => o.id === payment.operatorId);
        const routing = (operator?.routingNumber || "").replace(/\D/g, "");
        if (routing.length !== 9) {
          validationErrors.push(`${payment.operatorName}: Invalid routing number (must be 9 digits, got ${routing.length})`);
        }
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationErrors 
        });
      }

      // Generate CSV content with exact WSB format
      // Per WSB spec: exact headers, no quotes, transaction code 27 for debits
      const csvHeader = "Name,Routing transit,Account number,Transaction code,Amount,Payment information";
      const csvRows = payments.map((payment) => {
        const operator = operators.find((o) => o.id === payment.operatorId);
        const paymentAccount = accounts.find((a) => a.id === payment.accountId);
        
        // Name: truncate to 22 chars (ACH standard limit), remove commas to avoid CSV issues
        const name = (operator?.legalEntityName || payment.operatorName || "Unknown")
          .replace(/,/g, "")
          .substring(0, 22);
        
        // Routing: exactly 9 digits (already validated)
        const routing = (operator?.routingNumber || "").replace(/\D/g, "");
        
        // Account number: standard CSV quoting with double quotes (preserves leading zeros, prevents scientific notation)
        const accountNumRaw = operator?.accountNumber || "";
        const accountNum = `"${accountNumRaw}"`;
        
        // Transaction code: 27 = Checking Account Debit (for JIB payments)
        const transactionCode = "27";
        
        // Amount: exactly 2 decimal places, no $ or commas
        const amount = Number(payment.amount).toFixed(2);
        
        // Payment information format: {OperatorName} - {AccountName} #{OwnerNumber} - Invoice #{DocNum}
        const operatorShortName = (payment.operatorName || "Unknown").split(" ")[0];
        const accountName = paymentAccount?.accountName || "Account";
        const ownerNum = payment.ownerNumber || "";
        const docNum = payment.docNum || "";
        const paymentInfo = `${operatorShortName} - ${accountName} #${ownerNum} - Invoice #${docNum}`;
        
        // CSV row
        return `${name},${routing},${accountNum},${transactionCode},${amount},${paymentInfo}`;
      });
      const csvContent = [csvHeader, ...csvRows].join("\n");

      const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      res.json({
        success: true,
        fileName: batch.fileName,
        paymentCount: payments.length,
        totalAmount,
        csvContent,
      });
    } catch (error) {
      console.error("Download batch error:", error);
      res.status(500).json({ error: "Failed to download batch" });
    }
  });

  // Mark batch as processed (moves all payments in batch to processed status)
  app.post("/api/batches/:id/mark-processed", async (req, res) => {
    try {
      const batchId = req.params.id;
      const batch = await storage.getBatch(batchId);
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      // Get all payments in this batch
      const payments = await storage.getPayments({ batchId });
      const batchPayments = payments.filter((p) => p.status === "in_entry_tracker" || p.status === "in_bill_pay");

      // Update all to processed
      const now = new Date().toISOString().split("T")[0];
      for (const payment of batchPayments) {
        await storage.updatePayment(payment.id, {
          status: "processed",
          processedDate: now,
        });
      }

      // Log activity
      await storage.createActivity({
        action: "batch_processed",
        description: `Marked batch ${batch.batchName} as processed (${batchPayments.length} payments)`,
        accountId: batch.accountId,
      });

      res.json({ success: true, count: batchPayments.length });
    } catch (error) {
      console.error("Mark batch processed error:", error);
      res.status(500).json({ error: "Failed to mark batch as processed" });
    }
  });

  // Mark multiple payments as processed
  const markPaymentsProcessedSchema = z.object({
    paymentIds: z.array(z.string()).min(1),
  });

  app.post("/api/payments/mark-processed", async (req, res) => {
    try {
      const validated = markPaymentsProcessedSchema.parse(req.body);
      const { paymentIds } = validated;
      
      const now = new Date().toISOString().split("T")[0];
      let processedCount = 0;

      for (const paymentId of paymentIds) {
        const payment = await storage.getPayment(paymentId);
        if (payment && (payment.status === "in_entry_tracker" || payment.status === "in_bill_pay")) {
          await storage.updatePayment(paymentId, {
            status: "processed",
            processedDate: now,
          });
          processedCount++;
        }
      }

      // Log activity
      if (processedCount > 0) {
        await storage.createActivity({
          action: "payments_processed",
          description: `Marked ${processedCount} payments as processed`,
        });
      }

      res.json({ success: true, count: processedCount });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Mark payments processed error:", error);
      res.status(500).json({ error: "Failed to mark payments as processed" });
    }
  });

  // Activity Log
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getActivityLog(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const validated = insertActivityLogSchema.parse(req.body);
      const activity = await storage.createActivity(validated);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create activity" });
    }
  });

  // Assign operator to payment (and optionally save alias for future matching)
  const assignOperatorSchema = z.object({
    operatorId: z.string().min(1, "operatorId is required"),
    saveAsAlias: z.boolean().optional().default(false),
  });
  
  app.post("/api/payments/:id/assign-operator", async (req, res) => {
    try {
      const validated = assignOperatorSchema.parse(req.body);
      const { operatorId, saveAsAlias } = validated;
      const paymentId = req.params.id;
      
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      const operator = await storage.getOperator(operatorId);
      if (!operator) {
        return res.status(404).json({ error: "Operator not found" });
      }
      
      // Automatically save alias if the payment's operatorName differs from the canonical operator name
      // This enables learning from manual assignments for future imports
      const normalizedPaymentName = payment.operatorName?.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ') || '';
      const normalizedOperatorName = operator.operatorName.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
      const normalizedLegalName = operator.legalEntityName?.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ') || '';
      
      const isDifferentName = normalizedPaymentName !== normalizedOperatorName && 
                               normalizedPaymentName !== normalizedLegalName &&
                               payment.operatorName && 
                               payment.operatorName.length > 2;
      
      if (isDifferentName || saveAsAlias) {
        const existingAliases = operator.aliases || [];
        const alreadyExists = existingAliases.some(
          (a: string) => a.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ') === normalizedPaymentName
        );
        if (!alreadyExists && payment.operatorName) {
          await storage.updateOperator(operatorId, {
            aliases: [...existingAliases, payment.operatorName],
          });
        }
      }
      
      // Determine new status based on operator's ACH availability
      let newStatus = payment.status;
      let newMethod = payment.paymentMethod;
      if (operator.hasAch && operator.routingNumber && operator.accountNumber) {
        newStatus = "ready";
        newMethod = "ACH";
      } else {
        newStatus = "pending";
        newMethod = "Check";
      }
      
      // Update the payment with the operator assignment (keep original operatorName for reference)
      const updatedPayment = await storage.updatePayment(paymentId, {
        operatorId,
        operatorName: operator.operatorName, // Update to canonical operator name
        status: newStatus,
        paymentMethod: newMethod,
      });
      
      res.json(updatedPayment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Assign operator error:", error);
      res.status(500).json({ error: "Failed to assign operator" });
    }
  });

  // Generate ACH File
  const generateAchSchema = z.object({
    paymentIds: z.array(z.string()).min(1),
  });

  app.post("/api/generate-ach", async (req, res) => {
    try {
      const validated = generateAchSchema.parse(req.body);
      const { paymentIds } = validated;

      // Get the payments
      const allPayments = await storage.getPayments({});
      const paymentsToProcess = allPayments.filter(
        (p) => paymentIds.includes(p.id) && p.paymentMethod === "ACH"
      );

      if (paymentsToProcess.length === 0) {
        return res.status(400).json({ error: "No valid ACH payments selected" });
      }

      // Get operators and accounts for the CSV
      const operators = await storage.getOperators();
      const accounts = await storage.getAccounts();

      // Determine the account (use first payment's account)
      const accountId = paymentsToProcess[0].accountId;
      const account = accounts.find((a) => a.id === accountId);
      const accountName = account?.accountName || account?.accountPrefix || "ACH";

      // Generate file name per WSB spec: {AccountName}_ACH_{YYYY-MM-DD}.csv
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const fileName = `${accountName}_ACH_${dateStr}.csv`;

      // Validate routing numbers before generating
      const validationErrors: string[] = [];
      for (const payment of paymentsToProcess) {
        const operator = operators.find((o) => o.id === payment.operatorId);
        const routing = (operator?.routingNumber || "").replace(/\D/g, "");
        if (routing.length !== 9) {
          validationErrors.push(`${payment.operatorName}: Invalid routing number (must be 9 digits, got ${routing.length})`);
        }
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationErrors 
        });
      }

      // Generate CSV content with exact WSB format
      // Per WSB spec: exact headers, no quotes, transaction code 27 for debits
      const csvHeader = "Name,Routing transit,Account number,Transaction code,Amount,Payment information";
      const csvRows = paymentsToProcess.map((payment) => {
        const operator = operators.find((o) => o.id === payment.operatorId);
        const paymentAccount = accounts.find((a) => a.id === payment.accountId);
        
        // Name: truncate to 22 chars (ACH standard limit), remove commas to avoid CSV issues
        const name = (operator?.legalEntityName || payment.operatorName || "Unknown")
          .replace(/,/g, "")
          .substring(0, 22);
        
        // Routing: exactly 9 digits (already validated)
        const routing = (operator?.routingNumber || "").replace(/\D/g, "");
        
        // Account number: standard CSV quoting with double quotes (preserves leading zeros, prevents scientific notation)
        const accountNumRaw = operator?.accountNumber || "";
        const accountNum = `"${accountNumRaw}"`;
        
        // Transaction code: 27 = Checking Account Debit (for JIB payments)
        const transactionCode = "27";
        
        // Amount: exactly 2 decimal places, no $ or commas
        const amount = Number(payment.amount).toFixed(2);
        
        // Payment information format: {OperatorName} - {AccountName} #{OwnerNumber} - Invoice #{DocNum}
        const operatorShortName = (payment.operatorName || "Unknown").split(" ")[0];
        const accountName = paymentAccount?.accountName || "Account";
        const ownerNum = payment.ownerNumber || "";
        const docNum = payment.docNum || "";
        const paymentInfo = `${operatorShortName} - ${accountName} #${ownerNum} - Invoice #${docNum}`;
        
        // CSV row
        return `${name},${routing},${accountNum},${transactionCode},${amount},${paymentInfo}`;
      });
      const csvContent = [csvHeader, ...csvRows].join("\n");

      // Calculate total amount
      const totalAmount = paymentsToProcess.reduce((sum, p) => sum + Number(p.amount), 0);

      // Create batch record
      const accountPrefix = account?.accountPrefix || "ACH";
      const batch = await storage.createBatch({
        accountId,
        batchName: `${accountPrefix}_${today.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase().replace(" ", "")}`,
        fileName,
        totalAmount: totalAmount.toFixed(2),
        paymentCount: paymentsToProcess.length,
        paymentPeriod: today.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        generatedBy: "system",
      });

      // Update payments to in_entry_tracker status
      for (const payment of paymentsToProcess) {
        await storage.updatePayment(payment.id, {
          status: "in_entry_tracker",
          batchId: batch.id,
          batchName: batch.batchName,
        });
      }

      // Log activity
      await storage.createActivity({
        action: "ach_generated",
        description: `Generated ${fileName} with ${paymentsToProcess.length} payments ($${totalAmount.toFixed(2)})`,
        accountId,
      });

      res.json({
        success: true,
        fileName,
        paymentCount: paymentsToProcess.length,
        totalAmount,
        batchId: batch.id,
        csvContent,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Generate ACH error:", error);
      res.status(500).json({ error: "Failed to generate ACH file" });
    }
  });

  // Move payments to Entry Tracker - changes status from 'ready' to 'in_entry_tracker'
  app.post("/api/payments/move-to-entry-tracker", async (req, res) => {
    try {
      const allPayments = await storage.getPayments({});
      const readyPayments = allPayments.filter(p => p.status === "ready");

      if (readyPayments.length === 0) {
        return res.status(400).json({ error: "No ready payments to move" });
      }

      const updatedPayments = [];
      for (const payment of readyPayments) {
        const updatedPayment = await storage.updatePayment(payment.id, {
          status: "in_entry_tracker",
          entryEdited: false,
          entryEditedAt: null,
          entrySent: false,
          entrySentAt: null,
        });
        updatedPayments.push(updatedPayment);
      }

      await storage.createActivity({
        action: "entry_tracker",
        description: `Moved ${readyPayments.length} payments to Entry Tracker`,
        accountId: null,
      });

      res.json({
        success: true,
        movedCount: updatedPayments.length,
        payments: updatedPayments,
      });
    } catch (error) {
      console.error("Move to entry tracker error:", error);
      res.status(500).json({ error: "Failed to move payments to entry tracker" });
    }
  });

  // Send payment back to entry tracker (from processed back to in_entry_tracker or in_bill_pay)
  app.post("/api/payments/:id/send-back-to-entry", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      if (payment.status !== "processed") {
        return res.status(400).json({ error: "Only processed payments can be sent back to entry tracker" });
      }

      // Determine the correct status based on payment method
      const newStatus = payment.paymentMethod === "Check" ? "in_bill_pay" : "in_entry_tracker";
      
      const updatedPayment = await storage.updatePayment(payment.id, {
        status: newStatus,
        processedDate: null,
        entrySent: false,
        entryEdited: false,
      });

      await storage.createActivity({
        action: "send_back_to_entry",
        description: `Sent ${payment.operatorName || "Unknown"} payment back to Entry Tracker`,
        accountId: payment.accountId,
      });

      res.json(updatedPayment);
    } catch (error) {
      console.error("Send back to entry error:", error);
      res.status(500).json({ error: "Failed to send payment back to entry tracker" });
    }
  });

  // Mark single payment as complete (from entry tracker to processed)
  app.post("/api/payments/:id/mark-complete", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      if (payment.status !== "in_entry_tracker" && payment.status !== "in_bill_pay") {
        return res.status(400).json({ error: "Payment is not in entry tracker" });
      }
      if (!payment.entrySent) {
        return res.status(400).json({ error: "Payment must be marked as sent first" });
      }

      const updatedPayment = await storage.updatePayment(payment.id, {
        status: "processed",
        processedDate: new Date().toISOString().split("T")[0],
      });

      res.json(updatedPayment);
    } catch (error) {
      console.error("Mark complete error:", error);
      res.status(500).json({ error: "Failed to mark payment as complete" });
    }
  });

  // Mark all sent payments as complete (bulk action from entry tracker)
  app.post("/api/payments/mark-all-sent-complete", async (req, res) => {
    try {
      const allPayments = await storage.getPayments({});
      const sentPayments = allPayments.filter(
        p => (p.status === "in_entry_tracker" || p.status === "in_bill_pay") && p.entrySent
      );

      if (sentPayments.length === 0) {
        return res.status(400).json({ error: "No sent payments to mark complete" });
      }

      const now = new Date().toISOString().split("T")[0];
      const updatedPayments = [];
      for (const payment of sentPayments) {
        const updated = await storage.updatePayment(payment.id, {
          status: "processed",
          processedDate: now,
        });
        updatedPayments.push(updated);
      }

      await storage.createActivity({
        action: "mark_complete",
        description: `Marked ${sentPayments.length} payments as complete from Entry Tracker`,
        accountId: null,
      });

      res.json({
        success: true,
        completedCount: updatedPayments.length,
        payments: updatedPayments,
      });
    } catch (error) {
      console.error("Mark all sent complete error:", error);
      res.status(500).json({ error: "Failed to mark payments as complete" });
    }
  });

  // Mark check as sent (for Bill Pay Queue)
  const markCheckSentSchema = z.object({
    checkNumber: z.number().int().positive(),
  });

  // Bulk send checks to Bill Pay - moves all ready check payments to Entry Tracker Bill Pay section
  app.post("/api/payments/send-checks-to-bill-pay", async (req, res) => {
    try {
      const allPayments = await storage.getPayments({});
      const checkPayments = allPayments.filter(
        (p) => p.paymentMethod === "Check" && (p.status === "pending" || p.status === "ready")
      );

      if (checkPayments.length === 0) {
        return res.status(400).json({ error: "No check payments to send" });
      }

      const accounts = await storage.getAccounts();
      const updatedPayments = [];

      // Group by account to assign check numbers correctly
      const paymentsByAccount = new Map<string, typeof checkPayments>();
      for (const payment of checkPayments) {
        const existing = paymentsByAccount.get(payment.accountId) || [];
        existing.push(payment);
        paymentsByAccount.set(payment.accountId, existing);
      }

      const accountIds = Array.from(paymentsByAccount.keys());
      for (const accountId of accountIds) {
        const accountPayments = paymentsByAccount.get(accountId) || [];
        const account = accounts.find((a) => a.id === accountId);
        let currentCheckNum = account?.currentCheckNumber || 1000;

        for (const payment of accountPayments) {
          const updatedPayment = await storage.updatePayment(payment.id, {
            checkNumber: currentCheckNum,
            status: "in_bill_pay",
            notes: `Check #${currentCheckNum} sent via WSB Bill Pay`,
          });
          updatedPayments.push(updatedPayment);
          currentCheckNum++;
        }

        // Update account's next check number
        if (account) {
          await storage.updateAccount(accountId, {
            currentCheckNumber: currentCheckNum,
          });
        }
      }

      // Log activity
      await storage.createActivity({
        action: "checks_sent_to_bill_pay",
        description: `Sent ${checkPayments.length} checks to Bill Pay`,
      });

      res.json({
        success: true,
        count: updatedPayments.length,
        payments: updatedPayments,
      });
    } catch (error) {
      console.error("Send checks to bill pay error:", error);
      res.status(500).json({ error: "Failed to send checks to bill pay" });
    }
  });

  app.post("/api/payments/:id/mark-check-sent", async (req, res) => {
    try {
      const validated = markCheckSentSchema.parse(req.body);
      const { checkNumber } = validated;
      const paymentId = req.params.id;

      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Update the payment to in_bill_pay status with check number
      const updatedPayment = await storage.updatePayment(paymentId, {
        checkNumber,
        status: "in_bill_pay",
        notes: `Check #${checkNumber} sent via WSB Bill Pay`,
      });

      // Update account's next check number if needed
      const account = await storage.getAccount(payment.accountId);
      if (account && checkNumber >= (account.currentCheckNumber || 1000)) {
        await storage.updateAccount(payment.accountId, {
          currentCheckNumber: checkNumber + 1,
        });
      }

      // Log activity
      await storage.createActivity({
        action: "check_sent",
        description: `Check #${checkNumber} sent to ${payment.operatorName} for ${payment.amount}`,
        accountId: payment.accountId,
      });

      res.json(updatedPayment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Mark check sent error:", error);
      res.status(500).json({ error: "Failed to mark check as sent" });
    }
  });

  // JIB Import endpoint
  app.post("/api/import", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      const accountId = req.body.accountId;
      
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      if (!accountId) {
        return res.status(400).json({ error: "Account ID is required" });
      }

      // Get account to verify it exists
      const account = await storage.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Get all operators for matching
      const operators = await storage.getOperators();
      
      // Get existing payments for duplicate detection
      const existingPayments = await storage.getPayments({});
      
      // Get credits for credit availability checking
      const credits = await storage.getCredits();
      
      // Parse the Excel/CSV file
      let workbook: XLSX.WorkBook;
      try {
        workbook = XLSX.read(file.buffer, { type: "buffer" });
      } catch (parseErr) {
        return res.status(400).json({ error: "Could not parse file. Please upload a valid Excel or CSV file." });
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // Use raw: false to get formatted strings, preserving leading zeros in owner numbers
      const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

      if (!rawData || rawData.length === 0) {
        return res.status(400).json({ error: "File contains no data" });
      }

      // Find column mappings by looking at headers (flexible matching)
      const firstRow = rawData[0] as Record<string, unknown>;
      const headers = Object.keys(firstRow);
      
      // Helper to find column by patterns
      const findColumn = (patterns: string[]): string | null => {
        for (const header of headers) {
          const lowerHeader = header.toLowerCase();
          for (const pattern of patterns) {
            if (lowerHeader.includes(pattern.toLowerCase())) {
              return header;
            }
          }
        }
        return null;
      };

      // Map common JIB column names (including Bakken Clarity format)
      const operatorCol = findColumn(["operator", "payee", "company", "vendor"]);
      const amountCol = findColumn(["amtoriginal", "amount", "amt", "net", "total", "payment", "check amount"]);
      const ownerCol = findColumn(["opownernum", "owner", "interest", "account", "owner number", "owner no"]);
      const docNumCol = findColumn(["docnum", "doc", "document", "invoice", "reference", "ref", "check"]);
      const dateCol = findColumn(["receiveddate", "date", "due", "payment date"]);

      if (!operatorCol) {
        return res.status(400).json({ 
          error: "Could not find operator/payee column. Expected column with 'operator', 'payee', 'company', or 'vendor' in the name.",
          headers 
        });
      }
      if (!amountCol) {
        return res.status(400).json({ 
          error: "Could not find amount column. Expected column with 'amount', 'net', 'total', or 'payment' in the name.",
          headers 
        });
      }

      // Process each row into payment records
      const results = {
        total: 0,
        readyForAch: 0,
        unknownOperators: 0,
        markedForCheck: 0,
        possibleDuplicates: 0,
        withAvailableCredits: 0,
        payments: [] as { id: string; operatorName: string; amount: string; status: string; isPotentialDuplicate?: boolean; hasAvailableCredit?: boolean }[],
      };
      
      // Helper to normalize operator name for comparison
      const normalizeForMatch = (name: string) => {
        return name.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };
      
      // Helper to check for duplicate payment
      const findDuplicate = (opName: string, amount: number): string | null => {
        const normalizedName = normalizeForMatch(opName);
        for (const existing of existingPayments) {
          const existingNormalized = normalizeForMatch(existing.operatorName);
          const existingAmount = parseFloat(String(existing.amount));
          // Match by operator name (normalized) and exact amount
          if (existingNormalized === normalizedName && Math.abs(existingAmount - amount) < 0.01) {
            return existing.id;
          }
        }
        return null;
      };
      
      // Helper to get available credit for operator
      const getAvailableCredit = (operatorId: string | null): { hasCredit: boolean; creditAmount: number } => {
        if (!operatorId) return { hasCredit: false, creditAmount: 0 };
        const operatorCredits = credits.filter(c => 
          c.operatorId === operatorId && 
          c.isActive && 
          parseFloat(String(c.remainingBalance)) > 0
        );
        const totalCredit = operatorCredits.reduce((sum, c) => sum + parseFloat(String(c.remainingBalance)), 0);
        return { hasCredit: totalCredit > 0, creditAmount: totalCredit };
      };

      const importFileName = file.originalname;
      const importDate = new Date();

      for (const row of rawData as Record<string, unknown>[]) {
        const operatorName = String(row[operatorCol] || "").trim();
        const amountRaw = row[amountCol];
        const ownerNumber = ownerCol ? String(row[ownerCol] || "").trim() : null;
        const docNum = docNumCol ? String(row[docNumCol] || "").trim() : null;
        const dateRaw = dateCol ? row[dateCol] : null;

        // Parse amount
        let amount: number;
        if (typeof amountRaw === "number") {
          amount = amountRaw;
        } else {
          const amountStr = String(amountRaw).replace(/[$,\s]/g, "");
          amount = parseFloat(amountStr);
        }

        // Skip rows without valid operator or amount
        if (!operatorName || isNaN(amount) || amount === 0) {
          continue;
        }

        // Parse date or use current date
        let paymentDate = new Date().toISOString().split("T")[0];
        if (dateRaw) {
          if (typeof dateRaw === "number") {
            // Excel date serial - convert to JS date
            // Excel dates are days since Dec 30, 1899
            const excelEpoch = new Date(1899, 11, 30);
            const jsDate = new Date(excelEpoch.getTime() + dateRaw * 24 * 60 * 60 * 1000);
            paymentDate = jsDate.toISOString().split("T")[0];
          } else {
            const parsed = new Date(String(dateRaw));
            if (!isNaN(parsed.getTime())) {
              paymentDate = parsed.toISOString().split("T")[0];
            }
          }
        }

        // Match operator - try exact name first, then aliases only
        const operatorNormalized = normalizeForMatch(operatorName);
        
        let matchedOperator = operators.find(
          (op) => normalizeForMatch(op.operatorName) === operatorNormalized
        );
        
        // Second pass: check aliases
        if (!matchedOperator) {
          matchedOperator = operators.find((op) => {
            if (!op.aliases || op.aliases.length === 0) return false;
            return op.aliases.some((alias: string) => 
              normalizeForMatch(alias) === operatorNormalized
            );
          });
        }

        // Check for duplicate payment
        const duplicateId = findDuplicate(operatorName, amount);
        const isPotentialDuplicate = duplicateId !== null;
        if (isPotentialDuplicate) {
          results.possibleDuplicates++;
        }
        
        // Check for available credit
        const creditInfo = getAvailableCredit(matchedOperator?.id || null);
        if (creditInfo.hasCredit) {
          results.withAvailableCredits++;
        }

        // Determine status based on operator match and ACH availability
        let status = "pending";
        let paymentMethod = "Check";
        
        if (matchedOperator) {
          if (matchedOperator.hasAch && matchedOperator.routingNumber && matchedOperator.accountNumber) {
            status = "ready";
            paymentMethod = "ACH";
            results.readyForAch++;
          } else {
            status = "pending";
            paymentMethod = "Check";
            results.markedForCheck++;
          }
        } else {
          status = "pending";
          paymentMethod = "Check";
          results.unknownOperators++;
        }

        // Create payment record with duplicate and credit flags
        const payment = await storage.createPayment({
          accountId,
          operatorId: matchedOperator?.id || null,
          operatorName,
          ownerNumber,
          amount: amount.toFixed(2),
          paymentDate,
          docNum,
          paymentMethod,
          status,
          importFileName,
          importDate,
          isPotentialDuplicate,
          duplicateOfId: duplicateId,
          hasAvailableCredit: creditInfo.hasCredit,
          availableCreditAmount: creditInfo.hasCredit ? creditInfo.creditAmount.toFixed(2) : null,
        });

        results.payments.push({
          id: payment.id,
          operatorName: payment.operatorName,
          amount: payment.amount,
          isPotentialDuplicate,
          hasAvailableCredit: creditInfo.hasCredit,
          status: payment.status || "pending",
        });
        results.total++;
      }

      // Log the import activity
      await storage.createActivity({
        action: "import",
        description: `Imported ${results.total} payments for ${account.accountPrefix}`,
        accountId,
      });

      res.json(results);
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to process import" });
    }
  });

  // Historical payments import (for completed payments)
  app.post("/api/import-history", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      const accountId = req.body.accountId;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      if (!accountId) {
        return res.status(400).json({ error: "Account ID is required" });
      }

      const account = await storage.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      const operators = await storage.getOperators();

      let workbook: XLSX.WorkBook;
      try {
        workbook = XLSX.read(file.buffer, { type: "buffer" });
      } catch {
        return res.status(400).json({ error: "Could not parse file" });
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

      if (!rawData || rawData.length === 0) {
        return res.status(400).json({ error: "File contains no data" });
      }

      const firstRow = rawData[0] as Record<string, unknown>;
      const headers = Object.keys(firstRow);

      const findCol = (patterns: string[]): string | null => {
        for (const header of headers) {
          const lower = header.toLowerCase();
          for (const p of patterns) {
            if (lower.includes(p.toLowerCase())) return header;
          }
        }
        return null;
      };

      const operatorCol = findCol(["operator", "payee", "vendor"]);
      const amountCol = findCol(["amount", "amt", "total", "payment"]);
      const dateCol = findCol(["date", "payment date", "paid"]);
      const methodCol = findCol(["method", "type", "payment method"]);
      const checkCol = findCol(["check", "check number", "check #"]);
      const ownerCol = findCol(["owner", "interest", "account"]);
      const docCol = findCol(["doc", "invoice", "reference"]);

      if (!operatorCol || !amountCol) {
        return res.status(400).json({ 
          error: "Missing required columns. Need 'operator' and 'amount' columns.",
          headers 
        });
      }

      const normalizeForMatch = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      };

      let imported = 0;
      let skipped = 0;

      for (const row of rawData as Record<string, unknown>[]) {
        const operatorName = String(row[operatorCol] || "").trim();
        const amountRaw = row[amountCol];
        
        let amount: number;
        if (typeof amountRaw === "number") {
          amount = amountRaw;
        } else {
          amount = parseFloat(String(amountRaw).replace(/[$,\s]/g, ""));
        }

        if (!operatorName || isNaN(amount) || amount === 0) {
          skipped++;
          continue;
        }

        let paymentDate = new Date().toISOString().split("T")[0];
        if (dateCol && row[dateCol]) {
          const dateRaw = row[dateCol];
          if (typeof dateRaw === "number") {
            const excelEpoch = new Date(1899, 11, 30);
            const jsDate = new Date(excelEpoch.getTime() + (dateRaw as number) * 24 * 60 * 60 * 1000);
            paymentDate = jsDate.toISOString().split("T")[0];
          } else {
            const parsed = new Date(String(dateRaw));
            if (!isNaN(parsed.getTime())) {
              paymentDate = parsed.toISOString().split("T")[0];
            }
          }
        }

        const method = methodCol && row[methodCol] 
          ? String(row[methodCol]).toLowerCase().includes("ach") ? "ACH" : "Check"
          : "ACH";

        const checkNumberRaw = checkCol ? String(row[checkCol] || "").trim() : null;
        const checkNumber = checkNumberRaw ? parseInt(checkNumberRaw, 10) || null : null;
        const ownerNumber = ownerCol ? String(row[ownerCol] || "").trim() || null : null;
        const docNum = docCol ? String(row[docCol] || "").trim() || null : null;

        const operatorNormalized = normalizeForMatch(operatorName);
        let matchedOperator = operators.find(op => normalizeForMatch(op.operatorName) === operatorNormalized);
        
        if (!matchedOperator) {
          for (const op of operators) {
            if (op.aliases && op.aliases.some(a => normalizeForMatch(a) === operatorNormalized)) {
              matchedOperator = op;
              break;
            }
          }
        }

        await storage.createPayment({
          accountId,
          operatorId: matchedOperator?.id || null,
          operatorName,
          amount: amount.toFixed(2),
          paymentDate,
          paymentMethod: method,
          status: "processed",
          ownerNumber,
          docNum,
          checkNumber,
          processedDate: paymentDate,
        });

        imported++;
      }

      await storage.createActivity({
        action: "import",
        description: `Imported ${imported} historical payments for ${account.accountPrefix}`,
        accountId,
      });

      res.json({ imported, skipped, total: imported + skipped });
    } catch (error) {
      console.error("Historical import error:", error);
      res.status(500).json({ error: "Failed to process import" });
    }
  });

  // Download template for historical payments
  app.get("/api/import-history/template", (_req, res) => {
    const headers = [
      "Operator",
      "Amount",
      "Payment Date",
      "Payment Method",
      "Check Number",
      "Owner Number",
      "Doc/Invoice Number"
    ];
    
    const sampleRow = [
      "Continental Resources",
      "1234.56",
      "2025-12-15",
      "ACH",
      "",
      "12345-001",
      "INV-2025-001"
    ];

    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=historical_payments_template.csv");
    res.send(csvContent);
  });

  return httpServer;
}
