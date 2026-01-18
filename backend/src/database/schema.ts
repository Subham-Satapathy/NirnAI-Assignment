import { pgTable, serial, text, timestamp, integer, numeric, index } from 'drizzle-orm/pg-core';

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  buyerName: text('buyer_name').notNull(),
  buyerNameTamil: text('buyer_name_tamil'),
  sellerName: text('seller_name').notNull(),
  sellerNameTamil: text('seller_name_tamil'),
  houseNumber: text('house_number'),
  surveyNumber: text('survey_number').notNull(),
  documentNumber: text('document_number').notNull(),
  transactionDate: text('transaction_date'),
  transactionValue: numeric('transaction_value'),
  district: text('district'),
  village: text('village'),
  additionalInfo: text('additional_info'),
  pdfFileName: text('pdf_file_name'),
  extractedAt: timestamp('extracted_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  buyerNameIdx: index('buyer_name_idx').on(table.buyerName),
  sellerNameIdx: index('seller_name_idx').on(table.sellerName),
  houseNumberIdx: index('house_number_idx').on(table.houseNumber),
  surveyNumberIdx: index('survey_number_idx').on(table.surveyNumber),
  documentNumberIdx: index('document_number_idx').on(table.documentNumber),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
