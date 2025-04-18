import QRScanner from './components/QRScanner';
import QRForm from './components/QRForm';
import QRDisplay from './components/QRDisplay';
import { QRISData, QRISResult, ScanResult } from './types';
import { Scan } from 'lucide-react';

function App() {
  const [scanResult, setScanResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QRISResult | null>(null);

  const handleScanComplete = (result: ScanResult) => {
    if (result.data) {
      setScanResult(result.data);
      setResult(null);
    }
  };

  const handleGenerateQR = async (data: QRISData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (result.qrisBase64) {
        result.qrisBase64 = `data:image/png;base64,${result.qrisBase64}`;
      }
      setResult(result);
    } catch (error) {
      setResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate QR code'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">QRIS Generator</h1>
        <p className="text-gray-600">Upload a static QRIS code to generate a dynamic one</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Scan className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold">Scan QR Code</h2>
          </div>
          <QRScanner onScanComplete={handleScanComplete} />
          {scanResult && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Scanned QRIS:</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <code className="text-xs break-all">{scanResult}</code>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Generate Dynamic QRIS</h2>
          {scanResult ? (
            <QRForm
              qrisString={scanResult}
              onSubmit={handleGenerateQR}
              loading={loading}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              Please scan a QRIS code first
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="card mt-8">
          <QRDisplay result={result} />
        </div>
      )}
    </div>
  );
}

export default App;
