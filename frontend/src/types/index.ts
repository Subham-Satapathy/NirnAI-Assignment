export interface Transaction {
  id: number;
  buyerName: string;
  buyerNameTamil?: string;
  sellerName: string;
  sellerNameTamil?: string;
  houseNumber?: string;
  surveyNumber: string;
  documentNumber: string;
  transactionDate?: string;
  transactionValue?: string;
  district?: string;
  village?: string;
  additionalInfo?: string;
  pdfFileName?: string;
  extractedAt?: string;
  createdAt?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: Transaction[];
  totalExtracted?: number;
  totalFiltered?: number;
  totalInserted?: number;
}

export interface TransactionFilters {
  buyerName?: string;
  sellerName?: string;
  houseNumber?: string;
  surveyNumber?: string;
  documentNumber?: string;
}
