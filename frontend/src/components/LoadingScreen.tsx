'use client';

import React from 'react';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  totalPages?: number;
  currentPage?: number;
  currentStep?: string;
}

export default function LoadingScreen({ 
  message = 'Extracting transactions...', 
  progress = 0, 
  totalPages, 
  currentPage,
  currentStep = 'parsing'
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-100">
        <div className="text-center">
          {/* Animated Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <svg 
                className="animate-spin h-20 w-20 text-blue-600" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="3"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg 
                  className="h-10 w-10 text-blue-600 animate-pulse" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Message */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Processing Your PDF
          </h3>
          <p className="text-gray-600 mb-2">
            {message}
          </p>
          
          {/* Page Progress */}
          {totalPages && (
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-semibold text-blue-600">
                  {currentPage ? `Processing page ${currentPage} of ${totalPages}` : `Total pages: ${totalPages}`}
                </span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span className="font-medium">Progress</span>
                <span className="font-semibold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Loading Steps */}
          <div className="space-y-3 text-left bg-gray-50 rounded-xl p-4 border border-gray-100">
            <LoadingStep 
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              text="Reading PDF document" 
              active={currentStep === 'parsing'}
              completed={progress > 20}
            />
            <LoadingStep 
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              text="AI analyzing content" 
              active={currentStep === 'analyzing'}
              completed={progress > 40}
            />
            <LoadingStep 
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              text="Extracting transactions" 
              active={currentStep === 'extracting'}
              completed={progress > 70}
            />
            <LoadingStep 
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
              text="Processing results" 
              active={currentStep === 'processing'}
              completed={progress >= 100}
            />
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-800 font-medium">
                This may take a few moments for large documents
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingStep({ 
  icon, 
  text, 
  active = false, 
  completed = false 
}: { 
  icon: React.ReactNode; 
  text: string;
  active?: boolean;
  completed?: boolean;
}) {
  return (
    <div className={`flex items-center space-x-3 text-sm transition-all duration-300 ${
      completed ? 'text-green-600' : active ? 'text-blue-600' : 'text-gray-400'
    }`}>
      <div className={`flex-shrink-0 ${
        completed ? 'text-green-600' : active ? 'text-blue-600 animate-pulse' : 'text-gray-400'
      }`}>
        {completed ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          icon
        )}
      </div>
      <span className="font-medium">{text}</span>
      <div className="flex-1 flex items-center justify-end">
        {active && !completed && (
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
        {completed && (
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  );
}
