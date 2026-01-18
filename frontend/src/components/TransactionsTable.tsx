'use client';

import React from 'react';
import { Transaction } from '@/types';

interface TransactionsTableProps {
  transactions: Transaction[];
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Buyer
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Seller
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              House No.
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Survey No.
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Doc No.
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50 transition">
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.buyerName}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.sellerName}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.houseNumber || '-'}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.surveyNumber}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.documentNumber}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.transactionDate || '-'}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.transactionValue ? `₹${transaction.transactionValue}` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
