import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildOrderReceiptHtml, OrderReceiptData } from './orderReceipt';

export async function shareOrderReceiptPdf(receipt: OrderReceiptData): Promise<void> {
  const html = buildOrderReceiptHtml(receipt);
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Le téléchargement PDF n\'est pas disponible sur cet appareil.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `Reçu Shop-Edoo #${receipt.orderRef}`,
  });
}
