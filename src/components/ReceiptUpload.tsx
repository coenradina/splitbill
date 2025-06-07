'use client';

import { useState, useRef, useEffect } from 'react';
import { Expense } from '@/types';
import Script from 'next/script';

declare global {
  interface Window {
    Tesseract: any;
  }
}

interface ReceiptUploadProps {
  onExpenseDetected: (expense: Partial<Expense>) => void;
  paidById: string;
}

export default function ReceiptUpload({ onExpenseDetected, paidById }: ReceiptUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [status, setStatus] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      // Cleanup worker on component unmount
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const initializeWorker = async () => {
    try {
      if (!window.Tesseract) {
        throw new Error('Tesseract library not loaded');
      }

      setStatus('Creating Tesseract worker...');
      workerRef.current = await window.Tesseract.createWorker({
        logger: (progress: { status: string; progress: number }) => {
          console.log('OCR Progress:', progress);
          setLoadingProgress(Math.round(progress.progress * 100));
          setStatus(`${progress.status}... ${Math.round(progress.progress * 100)}%`);
        }
      });

      setStatus('Loading language data...');
      await workerRef.current.loadLanguage('eng');
      
      setStatus('Initializing engine...');
      await workerRef.current.initialize('eng');
      
      return true;
    } catch (error) {
      console.error('Error initializing Tesseract:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize OCR engine';
      setStatus(`Error: ${errorMessage}`);
      alert(`Failed to initialize OCR engine. Please refresh the page and try again.`);
      return false;
    }
  };

  const processReceipt = async (file: File) => {
    if (!isScriptLoaded) {
      setStatus('Error: OCR engine not loaded');
      alert('Please wait for the OCR engine to load completely and try again.');
      return;
    }

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setStatus('Error: Please upload an image file');
      alert('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setStatus('Error: Image file is too large');
      alert('Please upload an image smaller than 10MB');
      return;
    }

    setIsProcessing(true);
    setLoadingProgress(0);
    setStatus('Preparing to process image...');

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Initialize worker if not already initialized
      if (!workerRef.current) {
        const initialized = await initializeWorker();
        if (!initialized) {
          throw new Error('Failed to initialize OCR engine');
        }
      }

      setStatus('Processing image...');
      const { data: { text, confidence } } = await workerRef.current.recognize(file);
      console.log('Extracted text:', text); // Debug log
      console.log('OCR confidence:', confidence); // Debug log

      if (confidence < 30) {
        throw new Error('Low confidence in OCR results. Please try a clearer image.');
      }

      setStatus('Analyzing text...');
      // Improved regex patterns for better matching
      const amountPattern = /(?:total|amount|sum|subtotal|balance|due)[^\d]*\$?\s*(\d+\.?\d{0,2}|\.\d{2})/i;
      const descriptionPattern = /(?:item|description|product):\s*([^\n\r]*)/i;

      const amountMatch = text.match(amountPattern);
      const descriptionMatch = text.match(descriptionPattern);

      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        const description = descriptionMatch 
          ? descriptionMatch[1].trim() 
          : text.split('\n')[0].trim() || 'Receipt expense';
        
        console.log('Extracted data:', { amount, description, confidence }); // Debug log
        
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Invalid amount detected');
        }

        onExpenseDetected({
          description,
          amount,
          paidBy: paidById,
          splitAmong: [paidById]
        });

        setStatus('Successfully processed receipt!');
      } else {
        throw new Error('Could not find valid amount in receipt');
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatus(`Error: ${errorMessage}`);
      alert(`Error processing receipt: ${errorMessage}. Please try again.`);
      
      // Cleanup worker on error
      if (workerRef.current) {
        await workerRef.current.terminate();
        workerRef.current = null;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processReceipt(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processReceipt(file);
    }
  };

  const handleScriptLoad = () => {
    console.log('Tesseract script loaded');
    setIsScriptLoaded(true);
    // Initialize worker when script loads
    initializeWorker();
  };

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.min.js"
        onLoad={handleScriptLoad}
        onError={(e) => {
          console.error('Error loading Tesseract:', e);
          setStatus('Error: Failed to load OCR engine');
        }}
      />
      <div className="space-y-4">
        <div
          className="p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors hover:border-blue-500"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          {isProcessing ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p>{status}</p>
              {loadingProgress > 0 && loadingProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ) : (
            <p>{!isScriptLoaded ? 'Loading OCR engine...' : 'Click to upload or drag & drop a receipt image'}</p>
          )}
        </div>

        {previewUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Receipt Preview</p>
            <div className="relative aspect-[3/4] max-w-xs mx-auto">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="rounded-lg object-contain w-full h-full"
              />
            </div>
          </div>
        )}

        {status && !isProcessing && (
          <p className={`text-sm ${status.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {status}
          </p>
        )}
      </div>
    </>
  );
} 