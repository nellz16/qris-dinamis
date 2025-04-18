import { Handler } from "@netlify/functions";
import express, { Request, Response } from "express";
import serverless from "serverless-http";
import QRCode from "qrcode";

// CRC16 helper
function crc16(str: string): string {
  let crc = 0xFFFF;
  for (const ch of str) {
    crc ^= ch.charCodeAt(0) << 8;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

const app = express();
app.use(express.json());

app.post("/api/generate", async (req: Request, res: Response) => {
  try {
    const { qris, qty, service_fee, fee_type, fee_value } = req.body;
    if (!qris || !qty) {
      return res.status(400).json({ status: "error", message: "Parameter qris & qty diperlukan" });
    }

    // Build dynamic QRIS string
    const base = qris.slice(0, -4).replace("010211", "010212");
    const parts = base.split("5802ID");
    let amountField = "54" + qty.toString().length.toString().padStart(2, "0") + qty;
    if (service_fee && ["r", "p"].includes(fee_type)) {
      const tag = fee_type === "r" ? "55020256" : "55020357";
      amountField += tag + fee_value.length.toString().padStart(2, "0") + fee_value;
    }
    amountField += "5802ID";

    const payload = parts[0].trim() + amountField + parts[1].trim();
    const dynamic = payload + crc16(payload);

    // Generate QR code
    const dataUri = await QRCode.toDataURL(dynamic, { width: 300 });
    return res.json({ status: "success", qrisString: dynamic, qrisBase64: dataUri.split(",")[1] });
  } catch (error) {
    return res.status(500).json({ status: "error", message: (error as Error).message });
  }
});

export const handler: Handler = serverless(app);
