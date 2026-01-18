import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ExtractedTransaction, ProgressCallback } from './pdf-parser.service';

interface ChunkResult {
  chunkIndex: number;
  transactions: ExtractedTransaction[];
  tokensUsed: number;
  duration: number;
}

@Injectable()
export class OpenAIExtractionService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async extractTransactions(pdfText: string, onProgress?: ProgressCallback): Promise<ExtractedTransaction[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.');
    }

    // Check if document is too large and needs chunking
    const estimatedTokens = Math.ceil(pdfText.length / 2.5); // More accurate: ~2.5 chars per token
    
    // Optimized chunk sizing - larger chunks for faster processing
    // GPT-4o-mini has 128k context, we can be more aggressive
    let maxTokensPerRequest: number;
    if (estimatedTokens < 8000) {
      maxTokensPerRequest = 25000; // Small doc: very large chunks
    } else if (estimatedTokens < 30000) {
      maxTokensPerRequest = 20000; // Medium doc: large chunks
    } else if (estimatedTokens < 80000) {
      maxTokensPerRequest = 18000; // Large doc: still large chunks
    } else {
      maxTokensPerRequest = 15000; // Very large doc: moderate chunks
    }
    
    console.log(`[DOCUMENT] Estimated ${estimatedTokens} tokens, using ${maxTokensPerRequest} tokens per chunk`);
    
    if (estimatedTokens > maxTokensPerRequest) {
      console.log(`[CHUNKING] Document too large (~${estimatedTokens} tokens). Splitting into chunks...`);
      return this.extractTransactionsInChunks(pdfText, maxTokensPerRequest, onProgress);
    }

    onProgress?.('extracting', 50, 'Analyzing document...');
    const result = await this.extractTransactionsFromText(pdfText);
    onProgress?.('extracting', 70, `Found ${result.length} transactions`);
    return result;
  }

  private async extractTransactionsInChunks(
    pdfText: string,
    maxTokensPerRequest: number,
    onProgress?: ProgressCallback
  ): Promise<ExtractedTransaction[]> {
    const charsPerChunk = maxTokensPerRequest * 2; // 2 chars per token
    const chunks: string[] = [];
    
    onProgress?.('analyzing', 35, 'Splitting document into chunks...');
    
    // Split by pages or sections to avoid breaking transactions
    const pageDelimiters = ['\n\n\n', '\f', '---'];
    let remainingText = pdfText;
    
    while (remainingText.length > 0) {
      if (remainingText.length <= charsPerChunk) {
        chunks.push(remainingText);
        break;
      }
      
      // Find a good split point (look for page breaks near the chunk size)
      let splitIndex = charsPerChunk;
      for (const delimiter of pageDelimiters) {
        const idx = remainingText.lastIndexOf(delimiter, charsPerChunk);
        if (idx > charsPerChunk * 0.7) { // At least 70% of desired chunk size
          splitIndex = idx + delimiter.length;
          break;
        }
      }
      
      chunks.push(remainingText.substring(0, splitIndex));
      remainingText = remainingText.substring(splitIndex);
    }
    
    console.log(`[CHUNKS] Split document into ${chunks.length} chunks`);
    onProgress?.('extracting', 40, `Processing ${chunks.length} chunks...`);
    
    // Maximum parallel processing with limit of 10 chunks at once
    const MAX_PARALLEL = 10;
    let batchSize: number;
    let delayBetweenBatches: number;
    
    if (chunks.length <= MAX_PARALLEL) {
      // Process all chunks in parallel if under limit
      batchSize = chunks.length;
      delayBetweenBatches = 300;
      console.log(`[BATCH] Processing all ${batchSize} chunks in parallel`);
    } else {
      // Large document: process 10 chunks at a time
      batchSize = MAX_PARALLEL;
      delayBetweenBatches = 500;
      console.log(`[BATCH] Processing ${batchSize} chunks at a time (${chunks.length} total chunks)`);
    }
    
    const allTransactions: ExtractedTransaction[] = [];
    let totalTokensUsed = 0;
    let processedChunks = 0;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchPromises = batch.map((chunk, batchIdx) => {
        const chunkIndex = i + batchIdx;
        const estimatedChunkTokens = Math.ceil(chunk.length / 2.5);
        console.log(`[PROCESSING] Processing chunk ${chunkIndex + 1}/${chunks.length} (~${estimatedChunkTokens} tokens)...`);
        return this.extractTransactionsFromTextWithRetry(chunk, chunkIndex);
      });
      
      try {
        const results = await Promise.allSettled(batchPromises);
        
        results.forEach((result, batchIdx) => {
          const chunkIndex = i + batchIdx;
          processedChunks++;
          
          if (result.status === 'fulfilled') {
            const { transactions, tokensUsed, duration } = result.value;
            allTransactions.push(...transactions);
            totalTokensUsed += tokensUsed;
            
            // Calculate progress: 40% (start) + 40% * (chunks processed / total chunks)
            const chunkProgress = 40 + Math.round(40 * (processedChunks / chunks.length));
            onProgress?.('extracting', chunkProgress, `Processed chunk ${processedChunks}/${chunks.length} - found ${allTransactions.length} transactions`);
            
            console.log(`[SUCCESS] Chunk ${chunkIndex + 1} extracted ${transactions.length} transactions in ${duration.toFixed(1)}s (~${tokensUsed} tokens)`);
          } else {
            console.error(`[ERROR] Chunk ${chunkIndex + 1} failed after retries:`, result.reason?.message || result.reason);
          }
        });
        
        // Delay between batches to respect rate limits (adaptive based on document size)
        if (i + batchSize < chunks.length) {
          console.log(`⏳ Waiting ${delayBetweenBatches/1000}s before next batch...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      } catch (error) {
        console.error(`[ERROR] Batch processing error:`, error.message);
      }
    }
    
    console.log(`[TOKENS] Total tokens used: ~${totalTokensUsed}`);
    
    // Remove duplicates based on documentNumber
    const uniqueTransactions = this.removeDuplicates(allTransactions);
    console.log(`[RESULT] Total transactions after deduplication: ${uniqueTransactions.length}`);
    
    return uniqueTransactions;
  }

  private removeDuplicates(transactions: ExtractedTransaction[]): ExtractedTransaction[] {
    const seen = new Set<string>();
    return transactions.filter(t => {
      const key = `${t.documentNumber}-${t.surveyNumber}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private async extractTransactionsFromTextWithRetry(
    pdfText: string,
    chunkIndex: number,
    maxRetries = 3
  ): Promise<ChunkResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const transactions = await this.extractTransactionsFromText(pdfText);
        const duration = (Date.now() - startTime) / 1000;
        const tokensUsed = Math.ceil(pdfText.length / 2.5); // Estimate
        
        return {
          chunkIndex,
          transactions,
          tokensUsed,
          duration,
        };
      } catch (error) {
        lastError = error;
        console.warn(`[RETRY] Chunk ${chunkIndex + 1} attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`[RETRY] Retrying chunk ${chunkIndex + 1} in ${delay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Failed after max retries');
  }

  private async extractTransactionsFromText(pdfText: string): Promise<ExtractedTransaction[]> {
    // Enhanced prompt for better seller extraction and Tamil document handling
    const prompt = `Extract Tamil Nadu property sale deed transactions as JSON array.

CRITICAL INSTRUCTIONS:
- BUYER/PURCHASER: வாங்குபவர் / Purchaser / Buyer / Second Party
- SELLER/VENDOR: விற்பவர் / Vendor / Seller / First Party  
- ALWAYS transliterate Tamil names to ENGLISH (e.g., கோமேஷ் → Komesh, விஜயா → Vijaya)
- Use buyerName and sellerName fields for English transliterations
- Property transfer: Seller → Buyer

Required: surveyNumber, documentNumber
Optional: buyerName, sellerName, houseNumber, transactionDate (DD/MM/YYYY), transactionValue (numbers only), district, village

Rules:
1. TRANSLITERATE all Tamil text to English
2. ALWAYS extract BOTH buyer and seller names
3. If you see Tamil text, convert to English (கோமேஷ் → Komesh)
4. Use common Tamil name transliterations
5. Return valid JSON only, no markdown

Example: [{"surveyNumber":"329","documentNumber":"200/2014","buyerName":"Komesh","sellerName":"Chelluvamuthu","transactionValue":"300593","district":"Thiruvennainallur"}]

Text:
${pdfText}

JSON:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting structured data from Tamil Nadu property documents. CRITICAL: Always transliterate Tamil names to English using proper Tamil transliteration rules. NEVER output Tamil script in the JSON. Always identify BOTH buyer (வாங்குபவர்) and seller (விற்பவர்) names. Return only valid JSON array.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0,
        max_tokens: 8000, // Reduced for efficiency
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Clean up the response - remove markdown code blocks if present
      let jsonStr = content.trim();
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      jsonStr = jsonStr.trim();

      const transactions = JSON.parse(jsonStr);

      if (!Array.isArray(transactions)) {
        throw new Error('OpenAI response is not an array');
      }

      const validTransactions = transactions.filter(
        (t: any) => t.surveyNumber && t.documentNumber
      );

      // Validate and warn about data quality
      this.validateExtractionQuality(validTransactions);

      return validTransactions;
    } catch (error) {
      console.error('OpenAI extraction error:', error);
      throw new Error(`Failed to extract transactions with OpenAI: ${error.message}`);
    }
  }

  private validateExtractionQuality(transactions: ExtractedTransaction[]): void {
    if (transactions.length === 0) return;

    const missingSeller = transactions.filter(t => !t.sellerName || t.sellerName === 'Unknown').length;
    const missingValue = transactions.filter(t => !t.transactionValue).length;
    const missingLocation = transactions.filter(t => !t.district || !t.village).length;

    const total = transactions.length;
    const missingSellerPct = Math.round((missingSeller / total) * 100);
    const missingValuePct = Math.round((missingValue / total) * 100);
    const missingLocationPct = Math.round((missingLocation / total) * 100);

    console.log('[VALIDATION] Data Quality Check:');
    console.log(`[VALIDATION] Total Transactions: ${total}`);
    
    if (missingSeller > 0) {
      console.warn(`[WARNING] Missing Seller Names: ${missingSeller}/${total} (${missingSellerPct}%)`);
    }
    if (missingValue > 0) {
      console.warn(`[WARNING] Missing Transaction Values: ${missingValue}/${total} (${missingValuePct}%)`);
    }
    if (missingLocation > 0) {
      console.warn(`[WARNING] Missing Location Data: ${missingLocation}/${total} (${missingLocationPct}%)`);
    }

    if (missingSellerPct < 10 && missingValuePct < 10 && missingLocationPct < 10) {
      console.log('[VALIDATION] ✓ Data quality is good (>90% complete)');
    } else if (missingSellerPct > 50 || missingValuePct > 20) {
      console.warn('[WARNING] ⚠️  Data quality is poor. Consider:');
      console.warn('[WARNING]    - Checking PDF format and structure');
      console.warn('[WARNING]    - Verifying if source document has complete data');
      console.warn('[WARNING]    - Adjusting extraction prompts for this document type');
    }
  }

  isConfigured(): boolean {
    return this.openai !== null;
  }
}
