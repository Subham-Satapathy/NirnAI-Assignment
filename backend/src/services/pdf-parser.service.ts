import { Injectable } from '@nestjs/common';
import pdfParse = require('pdf-parse');
import { OpenAIExtractionService } from './openai-extraction.service';
import { CacheService } from './cache.service';

export interface ExtractedTransaction {
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
}

@Injectable()
export class PdfParserService {
  constructor(
    private readonly openaiService: OpenAIExtractionService,
    private readonly cacheService: CacheService,
  ) {}

  async parsePdf(buffer: Buffer, fileName: string = 'document.pdf'): Promise<ExtractedTransaction[]> {
    try {
      // Check cache first
      const fileHash = this.cacheService.generateHash(buffer);
      const cachedResults = await this.cacheService.get(fileHash);
      
      if (cachedResults) {
        return cachedResults;
      }

      console.log('[PDF PARSE] Parsing PDF buffer of size:', buffer.length, 'bytes');
      const data = await pdfParse(buffer);
      const text = data.text;
      
      console.log('[PDF] Extracted text length:', text.length, 'characters');
      console.log('[PDF] First 500 characters of PDF:', text.substring(0, 500));
      console.log('[PDF] Number of pages:', data.numpages);

      // If OpenAI is configured, use it for extraction
      if (this.openaiService.isConfigured()) {
        console.log('[OPENAI] Using OpenAI GPT-4 to parse document and extract transactions...');
        console.log('[OPENAI] Sending', text.length, 'characters to OpenAI...');
        try {
          const transactions = await this.openaiService.extractTransactions(text);
          console.log(`[SUCCESS] OpenAI successfully extracted ${transactions.length} transactions`);
          
          // Cache the results
          await this.cacheService.set(fileHash, transactions, fileName);
          
          return transactions;
        } catch (error) {
          console.error('[ERROR] OpenAI extraction failed, falling back to regex:', error.message);
          // Fall back to regex extraction
        }
      } else {
        console.log('');
        console.log('[WARNING] ========================================');
        console.log('[WARNING] OpenAI API KEY NOT CONFIGURED!');
        console.log('[WARNING] To use AI-powered extraction:');
        console.log('[WARNING] 1. Get key from: https://platform.openai.com/api-keys');
        console.log('[WARNING] 2. Edit .env file: OPENAI_API_KEY=sk-proj-your-key');
        console.log('[WARNING] 3. Restart: docker-compose restart backend');
        console.log('[WARNING] ========================================');
        console.log('');
        console.log('[WARNING] Falling back to regex extraction (low accuracy)...');
      }

      // Fallback: Parse the PDF text with regex and extract transactions
      console.log('[REGEX] Starting regex extraction...');
      const transactions = this.extractTransactions(text);
      console.log(`Regex extracted ${transactions.length} transactions`);
      
      return transactions;
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  private extractTransactions(text: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    
    // Split text into lines
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Pattern matching for Tamil real estate transactions
    // This is a simplified parser - you may need to adjust based on actual PDF format
    
    let currentTransaction: Partial<ExtractedTransaction> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for document numbers (typically numeric patterns)
      const docNumberMatch = line.match(/(?:Document|ஆவணம்|Doc)[\s:]*([0-9]+)/i);
      if (docNumberMatch) {
        if (currentTransaction.documentNumber) {
          // Save previous transaction
          if (this.isValidTransaction(currentTransaction)) {
            transactions.push(currentTransaction as ExtractedTransaction);
          }
          currentTransaction = {};
        }
        currentTransaction.documentNumber = docNumberMatch[1];
      }
      
      // Look for survey numbers
      const surveyMatch = line.match(/(?:Survey|சர்வே|S\.No)[\s:]*([0-9\/\-]+)/i);
      if (surveyMatch) {
        currentTransaction.surveyNumber = surveyMatch[1];
      }
      
      // Look for buyer/seller patterns
      if (line.match(/(?:Buyer|வாங்குபவர்|Purchaser)/i)) {
        const nextLine = lines[i + 1];
        if (nextLine) {
          if (this.isTamil(nextLine)) {
            currentTransaction.buyerNameTamil = nextLine;
          } else {
            currentTransaction.buyerName = nextLine;
          }
        }
      }
      
      if (line.match(/(?:Seller|விற்பவர்|Vendor)/i)) {
        const nextLine = lines[i + 1];
        if (nextLine) {
          if (this.isTamil(nextLine)) {
            currentTransaction.sellerNameTamil = nextLine;
          } else {
            currentTransaction.sellerName = nextLine;
          }
        }
      }
      
      // Look for house numbers
      const houseMatch = line.match(/(?:House|வீடு|H\.No)[\s:]*([0-9A-Za-z\-\/]+)/i);
      if (houseMatch) {
        currentTransaction.houseNumber = houseMatch[1];
      }
      
      // Look for dates
      const dateMatch = line.match(/(?:Date|தேதி)[\s:]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i);
      if (dateMatch) {
        currentTransaction.transactionDate = dateMatch[1];
      }
      
      // Look for values
      const valueMatch = line.match(/(?:Value|மதிப்பு|Amount|Rs|₹)[\s:]*([0-9,]+(?:\.[0-9]{2})?)/i);
      if (valueMatch) {
        currentTransaction.transactionValue = valueMatch[1].replace(/,/g, '');
      }
      
      // Extract district and village if present
      if (line.match(/(?:District|மாவட்டம்)/i)) {
        const districtMatch = line.match(/(?:District|மாவட்டம்)[\s:]*(.+)/i);
        if (districtMatch) {
          currentTransaction.district = districtMatch[1].trim();
        }
      }
      
      if (line.match(/(?:Village|கிராமம்)/i)) {
        const villageMatch = line.match(/(?:Village|கிராமம்)[\s:]*(.+)/i);
        if (villageMatch) {
          currentTransaction.village = villageMatch[1].trim();
        }
      }
    }
    
    // Add the last transaction
    if (this.isValidTransaction(currentTransaction)) {
      transactions.push(currentTransaction as ExtractedTransaction);
    }
    
    return transactions;
  }
  
  private isTamil(text: string): boolean {
    // Tamil Unicode range: \u0B80-\u0BFF
    return /[\u0B80-\u0BFF]/.test(text);
  }
  
  private isValidTransaction(transaction: Partial<ExtractedTransaction>): boolean {
    return !!(transaction.documentNumber && transaction.surveyNumber);
  }
}
