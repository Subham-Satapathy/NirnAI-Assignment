import { Injectable } from '@nestjs/common';

@Injectable()
export class TranslationService {
  // Simple Tamil to English transliteration map
  private readonly tamilToEnglishMap: { [key: string]: string } = {
    'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee', 'உ': 'u', 'ஊ': 'oo',
    'எ': 'e', 'ஏ': 'ae', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'o', 'ஔ': 'au',
    'க': 'ka', 'ங': 'nga', 'ச': 'cha', 'ஞ': 'nya', 'ட': 'ta', 'ண': 'na',
    'த': 'tha', 'ந': 'na', 'ப': 'pa', 'ம': 'ma', 'ய': 'ya', 'ர': 'ra',
    'ல': 'la', 'வ': 'va', 'ழ': 'zha', 'ள': 'la', 'ற': 'ra', 'ன': 'na',
  };

  async translateToEnglish(tamilText: string): Promise<string> {
    if (!tamilText || !this.isTamil(tamilText)) {
      return tamilText;
    }

    try {
      // Option 1: Use Google Translate API (if API key is provided)
      if (process.env.GOOGLE_TRANSLATE_API_KEY) {
        return await this.translateWithGoogle(tamilText);
      }
      
      // Option 2: Fallback to transliteration
      return this.transliterate(tamilText);
    } catch (error) {
      console.error('Translation error:', error);
      return this.transliterate(tamilText);
    }
  }

  private async translateWithGoogle(text: string): Promise<string> {
    // Placeholder for Google Translate API integration
    // If you have @google-cloud/translate package:
    /*
    const { Translate } = require('@google-cloud/translate').v2;
    const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });
    const [translation] = await translate.translate(text, 'en');
    return translation;
    */
    
    // For now, fall back to transliteration
    return this.transliterate(text);
  }

  private transliterate(tamilText: string): string {
    let result = '';
    
    for (const char of tamilText) {
      if (this.tamilToEnglishMap[char]) {
        result += this.tamilToEnglishMap[char];
      } else if (char.match(/[\u0B80-\u0BFF]/)) {
        // Tamil character not in map, add a placeholder
        result += char;
      } else {
        // Non-Tamil character (numbers, punctuation, etc.)
        result += char;
      }
    }
    
    // Capitalize first letter of each word
    return result
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private isTamil(text: string): boolean {
    // Tamil Unicode range: \u0B80-\u0BFF
    return /[\u0B80-\u0BFF]/.test(text);
  }

  async translateBatch(texts: string[]): Promise<string[]> {
    return Promise.all(texts.map(text => this.translateToEnglish(text)));
  }
}
