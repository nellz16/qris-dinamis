import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import bodyParser from 'body-parser';
import QRCode from 'qrcode';

// CRC16 implementation for QRIS
function crc16(data: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }

  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Function to process QRIS string
function processQRIS(
  qris: string, 
  qty: string, 
  serviceFee: boolean, 
  feeType: string, 
  feeValue: string
): string {
  // Strip last 4 chars (CRC)
  let qrisWithoutCRC = qris.slice(0, -4);
  
  // Replace "010211" with "010212"
  qrisWithoutCRC = qrisWithoutCRC.replace("010211", "010212");
  
  // Split on "5802ID"
  const parts = qrisWithoutCRC.split("5802ID");
  
  // Prepare amount field
  const amountTag = "54";
  const amountLength = qty.length.toString().padStart(2, '0');
  const amountField = amountTag + amountLength + qty;
  
  // Prepare fee field if service fee is enabled
  let feeField = "";
  if (serviceFee && feeValue && Number(feeValue) > 0) {
    const feeTag = "55";
    let calculatedFee;
    
    if (feeType === "p") {
      // Percentage fee
      calculatedFee = (Number(qty) * Number(feeValue) / 100).toFixed(2);
    } else {
      // Fixed fee
      calculatedFee = Number(feeValue).toFixed(2);
    }
    
    const feeLength = calculatedFee.toString().length.toString().padStart(2, '0');
    feeField = feeTag + feeLength + calculatedFee;
  }
  
  // Rebuild QRIS string
  const newQRIS = parts[0] + amountField + feeField + "5802ID" + parts[1];
  
  // Append new CRC16
  return newQRIS + crc16(newQRIS);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-server',
      configureServer(server) {
        server.middlewares.use(bodyParser.json());
        
        // API endpoint for QRIS generation
        server.middlewares.use('/api/generate', (req, res) => {
          if (req.method === 'POST') {
            try {
              const { qris, qty, service_fee, fee_type, fee_value } = req.body;
              
              if (!qris || !qty) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ 
                  status: 'error', 
                  message: 'QRIS and quantity are required' 
                }));
              }
              
              // Process QRIS string
              const qrisString = processQRIS(qris, qty, service_fee, fee_type, fee_value);
              
              // Generate QR code image
              QRCode.toDataURL(qrisString, { width: 300 })
                .then(qrisBase64 => {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    status: 'success',
                    qrisString,
                    qrisBase64
                  }));
                })
                .catch(err => {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    status: 'error',
                    message: 'Failed to generate QR code',
                    error: err.message
                  }));
                });
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                status: 'error', 
                message: error instanceof Error ? error.message : 'Unknown error' 
              }));
            }
          } else {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'Method not allowed' }));
          }
        });
      }
    }
  ],
  server: {
    port: 3001 // Specify a different port
  }
});