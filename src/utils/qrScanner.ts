import jsQR from 'jsqr';
import { ScanResult } from '../types';

export const scanQRCode = (file: File): Promise<ScanResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result) {
        return resolve({ data: '', error: 'Could not read the file' });
      }
      
      const img = new Image();
      img.onload = () => {
        // Create a canvas element to draw the image
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          return resolve({ data: '', error: 'Could not create canvas context' });
        }
        
        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        context.drawImage(img, 0, 0);
        
        // Get image data for QR code processing
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Process with jsQR
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          resolve({ data: code.data, format: 'QR_CODE' });
        } else {
          resolve({ data: '', error: 'No QR code found in the image' });
        }
      };
      
      img.onerror = () => {
        resolve({ data: '', error: 'Failed to load the image' });
      };
      
      // Set image source from the file reader result
      img.src = event.target.result as string;
    };
    
    reader.onerror = () => {
      resolve({ data: '', error: 'Error reading the file' });
    };
    
    // Read the file as a data URL
    reader.readAsDataURL(file);
  });
};
