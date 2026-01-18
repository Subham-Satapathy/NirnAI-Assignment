'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Transaction } from '@/types';

export default function TransactionsViewPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Get transactions from localStorage (passed from upload)
    const transactionsData = localStorage.getItem('uploadedTransactions');
    if (transactionsData) {
      try {
        const parsed = JSON.parse(transactionsData);
        setTransactions(parsed);
      } catch (error) {
        console.error('Error parsing transactions:', error);
      }
    }
    setLoading(false);
  }, [router]);

  const handleSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    // Convert to CSV
    const headers = ['Buyer Name', 'Seller Name', 'Survey Number', 'Document Number', 'Transaction Date', 'Transaction Value', 'District', 'Village', 'House Number'];
    const csvData = transactions.map(t => [
      t.buyerName || '',
      t.sellerName || '',
      t.surveyNumber || '',
      t.documentNumber || '',
      t.transactionDate || '',
      t.transactionValue || '',
      t.district || '',
      t.village || '',
      t.houseNumber || '',
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().getTime()}.csv`;
    a.click();
  };

  const getSortedAndFilteredTransactions = () => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        Object.values(t).some(val => 
          val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const filteredTransactions = getSortedAndFilteredTransactions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
              >
                <div className="mr-2 p-1 rounded-lg group-hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <span className="font-medium">Back</span>
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Extracted Transactions
                </h1>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">{filteredTransactions.length}</span> transactions found
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 flex items-center shadow-md hover:shadow-lg font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
        <div className="max-w-full mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search across all fields..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <svg 
                  className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Excel-like Table */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <TableHeader label="#" width="w-16" />
                  <TableHeader 
                    label="House No." 
                    sortable 
                    onSort={() => handleSort('houseNumber')}
                    sorted={sortConfig?.key === 'houseNumber' ? sortConfig.direction : undefined}
                  />
                  <TableHeader 
                    label="Survey No." 
                    sortable 
                    onSort={() => handleSort('surveyNumber')}
                    sorted={sortConfig?.key === 'surveyNumber' ? sortConfig.direction : undefined}
                  />
                  <TableHeader 
                    label="Doc. No." 
                    sortable 
                    onSort={() => handleSort('documentNumber')}
                    sorted={sortConfig?.key === 'documentNumber' ? sortConfig.direction : undefined}
                  />
                  <TableHeader 
                    label="Date" 
                    sortable 
                    onSort={() => handleSort('transactionDate')}
                    sorted={sortConfig?.key === 'transactionDate' ? sortConfig.direction : undefined}
                  />
                  <TableHeader 
                    label="Buyer Name" 
                    sortable 
                    onSort={() => handleSort('buyerName')}
                    sorted={sortConfig?.key === 'buyerName' ? sortConfig.direction : undefined}
                    width="w-48"
                  />
                  <TableHeader 
                    label="Seller Name" 
                    sortable 
                    onSort={() => handleSort('sellerName')}
                    sorted={sortConfig?.key === 'sellerName' ? sortConfig.direction : undefined}
                    width="w-48"
                  />
                  <TableHeader 
                    label="Value" 
                    sortable 
                    onSort={() => handleSort('transactionValue')}
                    sorted={sortConfig?.key === 'transactionValue' ? sortConfig.direction : undefined}
                  />
                  <TableHeader label="District" />
                  <TableHeader label="Village" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredTransactions.map((transaction, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-4 py-4 text-sm text-gray-500 font-semibold border-r border-gray-100 bg-gray-50">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap font-medium">
                      {transaction.houseNumber || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-blue-600 font-semibold whitespace-nowrap">
                      {transaction.surveyNumber}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap font-mono">
                      {transaction.documentNumber}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {transaction.transactionDate || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate font-medium" title={transaction.buyerName}>
                        {transaction.buyerName || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate font-medium" title={transaction.sellerName}>
                        {transaction.sellerName || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-green-700 whitespace-nowrap font-semibold">
                      {transaction.transactionValue ? `₹${Number(transaction.transactionValue).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {transaction.district || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {transaction.village || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No transactions found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search criteria or upload a new document</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TableHeaderProps {
  label: string;
  sortable?: boolean;
  onSort?: () => void;
  sorted?: 'asc' | 'desc';
  width?: string;
}

function TableHeader({ label, sortable, onSort, sorted, width }: TableHeaderProps) {
  return (
    <th 
      className={`px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider ${width || ''} ${sortable ? 'cursor-pointer hover:bg-gray-200 select-none transition-colors' : ''}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center space-x-2">
        <span>{label}</span>
        {sortable && (
          <span className={`text-sm transition-colors ${sorted ? 'text-blue-600' : 'text-gray-400'}`}>
            {sorted === 'asc' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : sorted === 'desc' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            )}
          </span>
        )}
      </div>
    </th>
  );
}
