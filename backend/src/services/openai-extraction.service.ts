import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ExtractedTransaction } from './pdf-parser.service';

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

  async extractTransactions(pdfText: string): Promise<ExtractedTransaction[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.');
    }

    // Check if document is too large and needs chunking
    const estimatedTokens = Math.ceil(pdfText.length / 2.5); // More accurate: ~2.5 chars per token
    const maxTokensPerRequest = 15000; // Reduced to avoid rate limits with gpt-4o-mini (30k TPM limit)
    
    if (estimatedTokens > maxTokensPerRequest) {
      console.log(`[CHUNKING] Document too large (~${estimatedTokens} tokens). Splitting into chunks...`);
      return this.extractTransactionsInChunks(pdfText, maxTokensPerRequest);
    }

    return this.extractTransactionsFromText(pdfText);
  }

  private async extractTransactionsInChunks(
    pdfText: string,
    maxTokensPerRequest: number
  ): Promise<ExtractedTransaction[]> {
    const charsPerChunk = maxTokensPerRequest * 2; // 2 chars per token
    const chunks: string[] = [];
    
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
    
    // Process chunks with controlled parallelism (2 at a time to respect rate limits)
    const allTransactions: ExtractedTransaction[] = [];
    const batchSize = 2; // Process 2 chunks in parallel
    let totalTokensUsed = 0;
    
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
          if (result.status === 'fulfilled') {
            const { transactions, tokensUsed, duration } = result.value;
            allTransactions.push(...transactions);
            totalTokensUsed += tokensUsed;
            console.log(`[SUCCESS] Chunk ${chunkIndex + 1} extracted ${transactions.length} transactions in ${duration.toFixed(1)}s (~${tokensUsed} tokens)`);
          } else {
            console.error(`[ERROR] Chunk ${chunkIndex + 1} failed after retries:`, result.reason?.message || result.reason);
          }
        });
        
        // Delay between batches to respect rate limits
        if (i + batchSize < chunks.length) {
          console.log(`⏳ Waiting 2 seconds before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
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
    // Optimized prompt - reduced tokens while maintaining accuracy
    const prompt = `Extract Tamil Nadu property transactions as JSON array.

Required fields: surveyNumber, documentNumber
Optional: buyerName, buyerNameTamil, sellerName, sellerNameTamil, houseNumber, transactionDate (DD/MM/YYYY), transactionValue (numbers only), district, village, additionalInfo

Rules:
1. Transliterate Tamil→English
2. Extract ALL transactions
3. Skip if missing surveyNumber/documentNumber
4. Return valid JSON only

Example: [{"surveyNumber":"123/4","documentNumber":"2023-001","buyerName":"Rajesh Kumar","transactionDate":"15/03/2023"}]

Text:
${pdfText}

JSON:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Extract real estate data. Return only valid JSON array, no markdown.',
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

      return transactions.filter(
        (t: any) => t.surveyNumber && t.documentNumber
      );
    } catch (error) {
      console.error('OpenAI extraction error:', error);
      throw new Error(`Failed to extract transactions with OpenAI: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return this.openai !== null;
  }
}
