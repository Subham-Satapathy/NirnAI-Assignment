import { Injectable } from '@nestjs/common';

interface ProgressData {
  step: string;
  progress: number;
  message: string;
  timestamp: number;
}

@Injectable()
export class ProgressTrackerService {
  private progressMap = new Map<string, ProgressData>();

  setProgress(sessionId: string, step: string, progress: number, message: string): void {
    this.progressMap.set(sessionId, {
      step,
      progress,
      message,
      timestamp: Date.now(),
    });
  }

  getProgress(sessionId: string): ProgressData | null {
    const data = this.progressMap.get(sessionId);
    
    // Clean up old progress data (older than 5 minutes)
    if (data && Date.now() - data.timestamp > 5 * 60 * 1000) {
      this.progressMap.delete(sessionId);
      return null;
    }
    
    return data || null;
  }

  clearProgress(sessionId: string): void {
    this.progressMap.delete(sessionId);
  }

  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.progressMap.entries()) {
      if (now - data.timestamp > 5 * 60 * 1000) {
        this.progressMap.delete(sessionId);
      }
    }
  }
}
