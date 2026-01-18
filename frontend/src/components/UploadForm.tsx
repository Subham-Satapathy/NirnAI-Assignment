'use client';

import React, { useState } from 'react';
import { transactionService } from '@/lib/api';
import { Transaction, TransactionFilters } from '@/types';

interface UploadFormProps {
  onUploadSuccess: (transactions: Transaction[], file: File) => void;
  onLoadingChange: (loading: boolean, totalPages?: number, progress?: number, step?: string) => void;
}

export default function UploadForm({ onUploadSuccess, onLoadingChange }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    onLoadingChange(true);
    setError('');
    setSuccess('');
    setQualityWarnings([]);

    try {
      // Start with initial progress
      let currentProgress = 0;
      let currentStepIndex = 0;
      const steps = ['parsing', 'analyzing', 'extracting', 'processing'];
      
      onLoadingChange(true, undefined, 0, 'parsing');
      
      // Start upload
      const uploadPromise = transactionService.uploadPdf(file, filters);
      
      // Smoothly increase progress while waiting (more realistic timing)
      const progressInterval = setInterval(() => {
        // Slower, more realistic progress
        // Progress speeds:
        // 0-30%: moderate (parsing/analyzing)
        // 30-70%: slow (extracting - main work)
        // 70-90%: fast (processing results)
        let targetProgress = 90;
        let speed = 0.05; // default slow speed for extraction
        
        if (currentProgress < 30) {
          speed = 0.15; // faster for initial parsing
        } else if (currentProgress > 70) {
          speed = 0.25; // faster for final processing
        }
        
        const increment = (targetProgress - currentProgress) * speed;
        currentProgress = Math.min(targetProgress, currentProgress + Math.max(increment, 0.5));
        
        // Update step based on progress
        if (currentProgress > 25 && currentStepIndex === 0) {
          currentStepIndex = 1;
        } else if (currentProgress > 45 && currentStepIndex === 1) {
          currentStepIndex = 2;
        } else if (currentProgress > 75 && currentStepIndex === 2) {
          currentStepIndex = 3;
        }
        
        onLoadingChange(true, undefined, Math.round(currentProgress), steps[currentStepIndex]);
      }, 400); // Update every 400ms for smoother animation
      
      const response = await uploadPromise;
      clearInterval(progressInterval);
      
      if (response.success) {
        // Update loading with totalPages info
        if (response.totalPages) {
          onLoadingChange(true, response.totalPages, 80, 'processing');
        }
        
        // Final progress
        onLoadingChange(true, response.totalPages, 100, 'complete');
        
        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setSuccess(response.message);
        
        // Check data quality and show warnings
        if (response.dataQuality && response.dataQuality.warnings) {
          setQualityWarnings(response.dataQuality.warnings);
        }
        
        onUploadSuccess(response.data, file);
        
        // Reset form
        setFile(null);
        setFilters({});
        const fileInput = document.getElementById('pdf-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload PDF');
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Upload PDF & Extract Transactions</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div>
          <label htmlFor="pdf-file" className="block text-sm font-medium text-gray-700 mb-2">
            PDF File *
          </label>
          <input
            id="pdf-file"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            required
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>
          )}
        </div>

        {/* Optional Filters */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Optional Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Buyer Name</label>
              <input
                type="text"
                value={filters.buyerName || ''}
                onChange={(e) => setFilters({ ...filters, buyerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                placeholder="Filter by buyer"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Seller Name</label>
              <input
                type="text"
                value={filters.sellerName || ''}
                onChange={(e) => setFilters({ ...filters, sellerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                placeholder="Filter by seller"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">House Number</label>
              <input
                type="text"
                value={filters.houseNumber || ''}
                onChange={(e) => setFilters({ ...filters, houseNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                placeholder="Filter by house no."
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Survey Number</label>
              <input
                type="text"
                value={filters.surveyNumber || ''}
                onChange={(e) => setFilters({ ...filters, surveyNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                placeholder="Filter by survey no."
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Document Number</label>
              <input
                type="text"
                value={filters.documentNumber || ''}
                onChange={(e) => setFilters({ ...filters, documentNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                placeholder="Filter by doc no."
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {qualityWarnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
            <div className="font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              Data Quality Warning
            </div>
            <ul className="list-disc list-inside space-y-1">
              {qualityWarnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs">The PDF may have incomplete data or formatting issues. Please verify critical information.</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Upload & Extract'}
        </button>
      </form>
    </div>
  );
}
