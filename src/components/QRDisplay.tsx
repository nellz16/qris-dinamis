@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary-color: #4361ee;
  --secondary-color: #3a86ff;
  --accent-color: #fb5607;
  --success-color: #06d6a0;
  --warning-color: #ffbe0b;
  --error-color: #ef476f;
  --background-color: #f8f9fa;
  --text-color: #212529;
}

body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  line-height: 1.5;
  min-height: 100vh;
}

.container {
  @apply max-w-4xl mx-auto px-4 py-8;
}

.card {
  @apply bg-white rounded-lg shadow-lg p-6 mb-6;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors duration-200;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50;
}

.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50;
}

.label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}import React, { useState } from 'react';
import { Copy, CheckCircle, XCircle, Download } from 'lucide-react';
import { QRISResult } from '../types';

interface QRDisplayProps {
  result: QRISResult;
}

const QRDisplay: React.FC<QRDisplayProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (result.qrisString) {
      try {
        await navigator.clipboard.writeText(result.qrisString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const downloadQRCode = () => {
    if (result.qrisBase64) {
      const link = document.createElement('a');
      link.href = result.qrisBase64;
      link.download = `qris-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (result.status === 'error') {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-md">
        <XCircle className="flex-shrink-0" size={20} />
        <span>{result.message || 'Failed to generate QR code'}</span>
      </div>
    );
  }

  if (!result.qrisBase64) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 max-w-xs">
        <img 
          src={result.qrisBase64}
          alt="Generated QR Code"
          className="w-full h-auto"
        />
      </div>
      
      <div className="flex gap-3 mb-6">
        <button
          onClick={downloadQRCode}
          className="btn btn-primary flex items-center gap-2"
        >
          <Download size={18} />
          Download QR Code
        </button>
        <button
          onClick={copyToClipboard}
          className="btn btn-secondary flex items-center gap-2"
        >
          {copied ? (
            <>
              <CheckCircle size={18} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={18} />
              Copy String
            </>
          )}
        </button>
      </div>
      
      {result.qrisString && (
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">QRIS String:</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
            <code className="text-xs break-all">{result.qrisString}</code>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRDisplay;
