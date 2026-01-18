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
    
    // Aggressive batch sizing for faster processing
    let batchSize: number;
    let delayBetweenBatches: number;
    
    if (chunks.length <= 3) {
      // Small document: process all chunks in parallel
      batchSize = chunks.length;
      delayBetweenBatches = 200;
      console.log(`[BATCH] Small document: processing ${batchSize} chunks in parallel`);
    } else if (chunks.length <= 8) {
      // Medium document: aggressive parallelism
      batchSize = 4;
      delayBetweenBatches = 500;
      console.log(`[BATCH] Medium document: batch size ${batchSize}, ${delayBetweenBatches}ms delay`);
    } else if (chunks.length <= 15) {
      // Large document: moderate parallelism
      batchSize = 3;
      delayBetweenBatches = 800;
      console.log(`[BATCH] Large document: batch size ${batchSize}, ${delayBetweenBatches}ms delay`);
    } else {
      // Very large document: still parallel but smaller batches
      batchSize = 2;
      delayBetweenBatches = 1000;
      console.log(`[BATCH] Very large document (${chunks.length} chunks): batch size ${batchSize}, ${delayBetweenBatches}ms delay`);
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

IMPORTANT - Field Identification:
- BUYER/PURCHASER: வாங்குபவர் / Purchaser / Buyer / Second Party
- SELLER/VENDOR: விற்பவர் / Vendor / Seller / First Party  
- If uncertain, check document flow: Seller → Buyer (property transfer direction)

Required: surveyNumber, documentNumber
Optional: buyerName, buyerNameTamil, sellerName, sellerNameTamil, houseNumber, transactionDate (DD/MM/YYYY), transactionValue (numbers only), district, village, additionalInfo

Rules:
1. ALWAYS try to identify BOTH seller and buyer names
2. Look for Tamil labels: விற்பவர் (seller), வாங்குபவர் (buyer)
3. Extract seller name even if not explicitly labeled
4. Transliterate Tamil names to English
5. If value/district/village missing, still extract other fields
6. Return valid JSON only

Example: [{"surveyNumber":"329","documentNumber":"200/2013","buyerName":"Nithya","sellerName":"Murugan","transactionValue":"314068","district":"Thiruvennainallur"}]

Text:
${pdfText}

JSON:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting structured data from Tamil Nadu property sale deed documents. You understand both Tamil and English text. CRITICAL: Always identify BOTH buyer (வாங்குபவர்) and seller (விற்பவர்) names. Return only valid JSON array, no markdown.',
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
