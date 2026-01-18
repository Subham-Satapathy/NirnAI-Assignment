import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TransactionController } from './controllers/transaction.controller';
import { AuthController } from './controllers/auth.controller';
import { PdfParserService } from './services/pdf-parser.service';
import { TranslationService } from './services/translation.service';
import { TransactionService } from './services/transaction.service';
import { OpenAIExtractionService } from './services/openai-extraction.service';
import { CacheService } from './services/cache.service';
import { ProgressTrackerService } from './services/progress-tracker.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your_jwt_secret_here_change_in_production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [TransactionController, AuthController],
  providers: [
    PdfParserService,
    TranslationService,
    TransactionService,
    OpenAIExtractionService,
    CacheService,
    ProgressTrackerService,
  ],
})
export class AppModule {}
