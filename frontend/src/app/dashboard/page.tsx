'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UploadForm from '@/components/UploadForm';
import LoadingScreen from '@/components/LoadingScreen';
import { Transaction } from '@/types';

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('uploadedTransactions');
    router.push('/');
  };

  const handleUploadSuccess = (uploadedTransactions: Transaction[], file: File) => {
    // Store transactions in localStorage
    localStorage.setItem('uploadedTransactions', JSON.stringify(uploadedTransactions));
    // Redirect to transactions view page
    router.push('/transactions');
  };

  const handleLoadingChange = (isLoading: boolean, pages?: number) => {
    setLoading(isLoading);
    if (pages !== undefined) {
      setTotalPages(pages);
    } else {
      setTotalPages(undefined);
    }
  };

  return (
    <>
      {loading && <LoadingScreen totalPages={totalPages} />}
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NirnAI Dashboard</h1>
                <p className="text-sm text-gray-600">PDF Transaction Extraction System</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Upload Form */}
          <div className="mb-8">
            <UploadForm 
              onUploadSuccess={handleUploadSuccess}
              onLoadingChange={handleLoadingChange}
            />
          </div>
            </main>
          </div>
        </>
      );
    }
