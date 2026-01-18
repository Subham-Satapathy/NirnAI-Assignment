import { Injectable } from '@nestjs/common';
import { db } from '../database/db';
import { transactions, Transaction, NewTransaction } from '../database/schema';
import { eq, and, like, or } from 'drizzle-orm';

export interface TransactionFilters {
  buyerName?: string;
  sellerName?: string;
  houseNumber?: string;
  surveyNumber?: string;
  documentNumber?: string;
}

@Injectable()
export class TransactionService {
  async create(transaction: NewTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

  async createMany(transactionList: NewTransaction[]): Promise<Transaction[]> {
    if (transactionList.length === 0) {
      return [];
    }
    
    const created = await db.insert(transactions).values(transactionList).returning();
    return created;
  }

  async findAll(): Promise<Transaction[]> {
    return db.select().from(transactions);
  }

  async findById(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async findByFilters(filters: TransactionFilters): Promise<Transaction[]> {
    const conditions = [];

    if (filters.buyerName) {
      conditions.push(like(transactions.buyerName, `%${filters.buyerName}%`));
    }

    if (filters.sellerName) {
      conditions.push(like(transactions.sellerName, `%${filters.sellerName}%`));
    }

    if (filters.houseNumber) {
      conditions.push(eq(transactions.houseNumber, filters.houseNumber));
    }

    if (filters.surveyNumber) {
      conditions.push(eq(transactions.surveyNumber, filters.surveyNumber));
    }

    if (filters.documentNumber) {
      conditions.push(eq(transactions.documentNumber, filters.documentNumber));
    }

    if (conditions.length === 0) {
      return this.findAll();
    }

    return db.select().from(transactions).where(and(...conditions));
  }

  async search(query: string): Promise<Transaction[]> {
    if (!query) {
      return this.findAll();
    }

    return db
      .select()
      .from(transactions)
      .where(
        or(
          like(transactions.buyerName, `%${query}%`),
          like(transactions.sellerName, `%${query}%`),
          like(transactions.houseNumber, `%${query}%`),
          like(transactions.surveyNumber, `%${query}%`),
          like(transactions.documentNumber, `%${query}%`)
        )
      );
  }

  async deleteAll(): Promise<void> {
    await db.delete(transactions);
  }
}
