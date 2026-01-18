import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfParserService } from '../services/pdf-parser.service';
import { TranslationService } from '../services/translation.service';
import { TransactionService } from '../services/transaction.service';
import { UploadPdfDto } from '../dto/transaction.dto';
import { NewTransaction } from '../database/schema';

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly pdfParserService: PdfParserService,
    private readonly translationService: TranslationService,
    private readonly transactionService: TransactionService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('pdf'))
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body() filters: UploadPdfDto,
  ) {
    console.log('[ENDPOINT] Upload endpoint called');
    console.log('[UPLOAD] File received:', file ? file.originalname : 'NO FILE');
    console.log('[UPLOAD] File size:', file ? file.size : 'N/A');
    console.log('[UPLOAD] Filters:', filters);

    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    try {
      console.log('[PARSE] Starting PDF parsing...');
      // Step 1: Parse PDF (with caching)
      const { transactions: extractedTransactions, totalPages } = await this.pdfParserService.parsePdf(
        file.buffer,
        file.originalname
      );
      console.log('[SUCCESS] Extraction complete. Found:', extractedTransactions.length, 'transactions');
      console.log('[SUCCESS] PDF has', totalPages, 'pages');

      if (extractedTransactions.length === 0) {
        return {
          success: true,
          message: 'No transactions found in the PDF',
          data: [],
          totalPages,
        };
      }

      // Step 2: Translate Tamil fields to English
      const translatedTransactions = await Promise.all(
        extractedTransactions.map(async (transaction) => {
          const translatedData: any = {
            ...transaction,
            buyerName: transaction.buyerName || 
              (transaction.buyerNameTamil ? await this.translationService.translateToEnglish(transaction.buyerNameTamil) : 'Unknown'),
            sellerName: transaction.sellerName || 
              (transaction.sellerNameTamil ? await this.translationService.translateToEnglish(transaction.sellerNameTamil) : 'Unknown'),
            pdfFileName: file.originalname,
          };
          return translatedData;
        })
      );

      // Step 3: Apply filters if provided
      let filteredTransactions = translatedTransactions;
      if (filters.buyerName || filters.sellerName || filters.houseNumber || 
          filters.surveyNumber || filters.documentNumber) {
        filteredTransactions = translatedTransactions.filter((transaction) => {
          return (
            (!filters.buyerName || transaction.buyerName.toLowerCase().includes(filters.buyerName.toLowerCase())) &&
            (!filters.sellerName || transaction.sellerName.toLowerCase().includes(filters.sellerName.toLowerCase())) &&
            (!filters.houseNumber || transaction.houseNumber === filters.houseNumber) &&
            (!filters.surveyNumber || transaction.surveyNumber === filters.surveyNumber) &&
            (!filters.documentNumber || transaction.documentNumber === filters.documentNumber)
          );
        });
      }

      if (filteredTransactions.length === 0) {
        return {
          success: true,
          message: 'No transactions match the provided filters',
          data: [],
          totalExtracted: extractedTransactions.length,
          totalFiltered: 0,
          totalPages,
        };
      }

      // Step 4: Insert into database
      const insertedTransactions = await this.transactionService.createMany(
        filteredTransactions as NewTransaction[]
      );

      // Data quality metrics
      const dataQuality = this.calculateDataQuality(extractedTransactions);

      return {
        success: true,
        message: `Successfully processed ${insertedTransactions.length} transactions`,
        data: insertedTransactions,
        totalExtracted: extractedTransactions.length,
        totalFiltered: filteredTransactions.length,
        totalInserted: insertedTransactions.length,
        totalPages,
        dataQuality, // Include quality metrics in response
      };
    } catch (error) {
      throw new BadRequestException(`Failed to process PDF: ${error.message}`);
    }
  }

  @Get()
  async getTransactions(@Query() filters: UploadPdfDto) {
    try {
      const transactions = await this.transactionService.findByFilters(filters);
      
      return {
        success: true,
        data: transactions,
        count: transactions.length,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch transactions: ${error.message}`);
    }
  }

  @Get('search')
  async searchTransactions(@Query('q') query: string) {
    try {
      const transactions = await this.transactionService.search(query);
      
      return {
        success: true,
        data: transactions,
        count: transactions.length,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to search transactions: ${error.message}`);
    }
  }

  private calculateDataQuality(transactions: any[]): any {
    if (transactions.length === 0) {
      return { quality: 'unknown', completeness: 0 };
    }

    const total = transactions.length;
    const missingSeller = transactions.filter(t => !t.sellerName || t.sellerName === 'Unknown').length;
    const missingValue = transactions.filter(t => !t.transactionValue).length;
    const missingLocation = transactions.filter(t => !t.district || !t.village).length;
    
    const completeRecords = total - Math.max(missingSeller, missingValue, missingLocation);
    const completeness = Math.round((completeRecords / total) * 100);

    let quality = 'excellent';
    let warnings: string[] = [];

    if (missingSeller > total * 0.5) {
      quality = 'poor';
      warnings.push(`${Math.round((missingSeller/total)*100)}% missing seller names`);
    } else if (missingSeller > total * 0.2) {
      quality = 'fair';
      warnings.push(`${Math.round((missingSeller/total)*100)}% missing seller names`);
    }

    if (missingValue > total * 0.1) {
      quality = quality === 'excellent' ? 'good' : quality;
      warnings.push(`${Math.round((missingValue/total)*100)}% missing transaction values`);
    }

    if (missingLocation > total * 0.1) {
      quality = quality === 'excellent' ? 'good' : quality;
      warnings.push(`${Math.round((missingLocation/total)*100)}% missing location data`);
    }

    return {
      quality,
      completeness,
      total,
      complete: completeRecords,
      incomplete: total - completeRecords,
      warnings: warnings.length > 0 ? warnings : undefined,
      details: {
        missingSeller,
        missingValue,
        missingLocation,
      }
    };
  }
}
