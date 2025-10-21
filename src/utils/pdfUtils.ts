/**
 * Utility functions for handling PDF downloads
 */

/**
 * Download a PDF blob as a file
 * @param blob - The PDF blob to download
 * @param filename - The filename for the downloaded file
 */
export const downloadPDF = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Generate a filename for contract PDF
 * @param orderCode - The order code
 * @param date - Optional date, defaults to current date
 * @returns Formatted filename
 */
export const generateContractFilename = (orderCode: string, date?: Date): string => {
  const now = date || new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  return `Hop-dong-${orderCode}-${dateStr}.pdf`;
};
