'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UploadForm from '@/components/UploadForm';
import LoadingScreen from '@/components/LoadingScreen';
import { Transaction } from '@/types';

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
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

  return (
    <>
      {loading && <LoadingScreen />}
      
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
              onLoadingChange={setLoading}
            />
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <InfoCard
              icon={
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              title="AI-Powered Extraction"
              description="Advanced GPT-4 technology accurately identifies and extracts transaction data from complex documents"
              gradient="from-blue-500 to-cyan-500"
            />
            <InfoCard
              icon={
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="Lightning Fast"
              description="Parallel processing with intelligent caching delivers results in seconds, even for large documents"
              gradient="from-purple-500 to-pink-500"
            />
            <InfoCard
              icon={
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="Export Ready"
              description="Download extracted data as CSV files, ready for Excel, Google Sheets, or any analysis tool"
              gradient="from-green-500 to-emerald-500"
            />
          </div>
        </main>
      </div>
    </>
  );
}

function InfoCard({ icon, title, description, gradient }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  gradient: string;
}) {
  return (
    <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      <div className="relative p-6">
        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${gradient} text-white mb-4 shadow-lg`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
