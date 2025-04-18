import React, { useState, useRef } from 'react';
import { AlertCircle, Upload, Loader2 } from 'lucide-react';
import { scanQRCode } from '../utils/qrScanner';
import { ScanResult } from '../types';

interface QRScannerProps {
  onScanComplete: (result: ScanResult) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    setError(null);
    
    try {
      const result = await scanQRCode(file);
      if (result.error) {
        setError(result.error);
      } else {
        onScanComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error scanning QR code');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col items-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-primary flex items-center justify-center gap-2"
          disabled={isScanning}
        >
          {isScanning ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Upload size={18} />
          )}
          {isScanning ? 'Scanning...' : 'Upload QR Image'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {error && (
          <div className="mt-4 flex items-center text-red-500 bg-red-50 p-3 rounded-md">
            <AlertCircle className="mr-2 flex-shrink-0" size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;