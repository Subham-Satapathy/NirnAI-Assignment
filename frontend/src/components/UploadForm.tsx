'use client';

import React, { useState } from 'react';
import { transactionService } from '@/lib/api';
import { Transaction, TransactionFilters } from '@/types';

interface UploadFormProps {
  onUploadSuccess: (transactions: Transaction[], file: File) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function UploadForm({ onUploadSuccess, onLoadingChange }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

    try {
      const response = await transactionService.uploadPdf(file, filters);
      
      if (response.success) {
        setSuccess(response.message);
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
