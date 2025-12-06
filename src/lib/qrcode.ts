import CryptoJS from 'crypto-js';

const SECRET_KEY = 'SixEvents2025SecretKey'; // Em produção, usar variável de ambiente

export interface QRCodeData {
  ticketId: string;
  reservationId: string;
  eventId: string;
  participantName: string;
  ticketNumber: number;
  eventDate: string;
  timestamp: number;
}

/**
 * Gera dados criptografados para o QR code
 */
export function generateQRCodeData(data: QRCodeData): string {
  const payload = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(payload, SECRET_KEY).toString();
  const signature = CryptoJS.HmacSHA256(encrypted, SECRET_KEY).toString();
  
  return JSON.stringify({
    data: encrypted,
    sig: signature
  });
}

/**
 * Decodifica e valida dados do QR code
 */
export function decodeQRCodeData(qrData: string): QRCodeData | null {
  try {
    const parsed = JSON.parse(qrData);
    
    // Verificar assinatura
    const expectedSig = CryptoJS.HmacSHA256(parsed.data, SECRET_KEY).toString();
    if (parsed.sig !== expectedSig) {
      console.error('Invalid QR code signature');
      return null;
    }
    
    // Descriptografar
    const decrypted = CryptoJS.AES.decrypt(parsed.data, SECRET_KEY);
    const payload = decrypted.toString(CryptoJS.enc.Utf8);
    
    return JSON.parse(payload) as QRCodeData;
  } catch (error) {
    console.error('Error decoding QR code:', error);
    return null;
  }
}

/**
 * Gera código único alfanumérico
 */
export function generateUniqueCode(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
