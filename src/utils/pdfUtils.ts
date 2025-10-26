import html2pdf from 'html2pdf.js';

/**
 * Types for PDF generation
 */
export interface QuotePDFData {
  quoteCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  dealershipName: string;
  dealershipAddress: string;
  items: Array<{
    vehicleName: string;
    color?: string;
    quantity: number;
    unitPrice: number;
    accessories?: Array<{ name: string; quantity: number; price: number }>;
    options?: Array<{ name: string; price: number }>;
    discount: number;
    finalAmount: number;
  }>;
  totalAmount: number;
  notes?: string;
  validUntil?: Date;
}

export interface ContractPDFData {
  contractCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  dealershipName: string;
  dealershipAddress: string;
  dealershipPhone: string;
  dealershipTaxCode: string;
  representative: string;
  items: Array<{
    vehicleName: string;
    color?: string;
    quantity: number;
    unitPrice: number;
    accessories?: Array<{ name: string; quantity: number; price: number }>;
    options?: Array<{ name: string; price: number }>;
    discount: number;
    finalAmount: number;
  }>;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: 'cash' | 'installment';
  deliveryAddress?: string;
  deliveryDate?: Date;
  notes?: string;
}

/**
 * Format currency to Vietnamese VND format
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

/**
 * Format date to Vietnamese format
 */
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Generate Quote PDF
 */
export const generateQuotePDF = async (data: QuotePDFData): Promise<void> => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'DejaVu Sans', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
      font-size: 12px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    h1 {
      color: #1a73e8;
      margin: 10px 0;
      font-size: 18px;
    }
    .quote-info {
      text-align: center;
      margin-bottom: 20px;
      font-size: 11px;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 10px;
      color: #1a73e8;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #e8f0fe;
      font-weight: bold;
    }
    .total {
      text-align: right;
      font-size: 14px;
      font-weight: bold;
      color: #d93025;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>BÁO GIÁ XE ĐIỆN</h1>
    <div class="quote-info">
      <p>Mã báo giá: <strong>${data.quoteCode}</strong></p>
      <p>Ngày: ${formatDate(new Date())}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">THÔNG TIN KHÁCH HÀNG</div>
    <p>Họ và tên: ${data.customerName}</p>
    <p>Điện thoại: ${data.customerPhone}</p>
    <p>Email: ${data.customerEmail}</p>
    <p>Địa chỉ: ${data.customerAddress}</p>
  </div>

  <div class="section">
    <div class="section-title">THÔNG TIN ĐẠI LÝ</div>
    <p>Tên đại lý: ${data.dealershipName}</p>
    <p>Địa chỉ: ${data.dealershipAddress}</p>
  </div>

  <div class="section">
    <div class="section-title">CHI TIẾT BÁO GIÁ</div>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Tên xe</th>
          <th>Đơn giá</th>
          <th>SL</th>
          <th>Giảm giá</th>
          <th>Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.vehicleName}${item.color ? ' (' + item.color + ')' : ''}</td>
            <td>${formatCurrency(item.unitPrice)} VNĐ</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.discount)} VNĐ</td>
            <td>${formatCurrency(item.finalAmount)} VNĐ</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="total">
    <p>TỔNG CỘNG: ${formatCurrency(data.totalAmount)} VNĐ</p>
  </div>

  ${data.validUntil ? `<p style="text-align: center; font-style: italic; margin-top: 20px;">Báo giá có hiệu lực đến: ${formatDate(data.validUntil)}</p>` : ''}
  ${data.notes ? `<div class="section"><p><strong>Ghi chú:</strong> ${data.notes}</p></div>` : ''}
  
  <p style="text-align: center; margin-top: 40px; font-size: 10px; color: #888;">Đây là báo giá sơ bộ, giá có thể thay đổi theo thời điểm.</p>
</body>
</html>
  `;

  const element = document.createElement('div');
  element.innerHTML = htmlContent;
  
  const opt = {
    margin: [20, 20, 20, 20] as [number, number, number, number],
    filename: `Bao-gia-${data.quoteCode}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
  };

  await html2pdf().set(opt).from(element).save();
};

/**
 * Generate Contract PDF
 */
export const generateContractPDF = async (data: ContractPDFData): Promise<void> => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'DejaVu Sans', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
      font-size: 11px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    h2 {
      margin: 5px 0;
      font-size: 12px;
    }
    h1 {
      font-size: 18px;
      color: #1a73e8;
      margin: 10px 0;
    }
    .section-title {
      font-weight: bold;
      font-size: 13px;
      margin: 15px 0 10px 0;
      color: #1a73e8;
      border-bottom: 2px solid #1a73e8;
      padding-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 10px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 8px;
    }
    th {
      background-color: #e8f0fe;
      font-weight: bold;
    }
    .payment-info {
      margin-top: 15px;
      padding: 10px;
      border: 1px solid #ddd;
      background-color: #f9f9f9;
    }
    .amount-highlight {
      color: #d93025;
      font-weight: bold;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
    <h2>Độc Lập – Tự Do – Hạnh Phúc</h2>
    <h1>HỢP ĐỒNG MUA BÁN XE ĐIỆN</h1>
    <p>Số hợp đồng: <strong>${data.contractCode}</strong></p>
    <p>Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>
  </div>

  <div class="section-title">ĐIỀU 1: THÔNG TIN CÁC BÊN</div>
  <table>
    <tr>
      <th style="width:50%">Bên A (Bên bán)</th>
      <th>Bên B (Bên mua)</th>
    </tr>
    <tr>
      <td>
        <p>Tên đại lý: ${data.dealershipName}</p>
        <p>Địa chỉ: ${data.dealershipAddress}</p>
        <p>Điện thoại: ${data.dealershipPhone}</p>
        <p>MST: ${data.dealershipTaxCode}</p>
        <p>Người đại diện: ${data.representative}</p>
      </td>
      <td>
        <p>Họ và tên: ${data.customerName}</p>
        <p>Địa chỉ: ${data.customerAddress}</p>
        <p>Điện thoại: ${data.customerPhone}</p>
        <p>Email: ${data.customerEmail}</p>
      </td>
    </tr>
  </table>

  <div class="section-title">ĐIỀU 2: THÔNG TIN XE VÀ GIÁ BÁN</div>
  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Tên xe</th>
        <th>SL</th>
        <th>Đơn giá</th>
        <th>Giảm giá</th>
        <th>Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.vehicleName}${item.color ? ' (' + item.color + ')' : ''}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unitPrice)} VNĐ</td>
          <td>${formatCurrency(item.discount)} VNĐ</td>
          <td>${formatCurrency(item.finalAmount)} VNĐ</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="payment-info">
    <p>Phương thức thanh toán: ${data.paymentMethod === 'installment' ? 'Trả góp' : 'Tiền mặt'}</p>
    <p>Đã thanh toán: ${formatCurrency(data.paidAmount)} VNĐ</p>
    <p class="amount-highlight">Còn lại: ${formatCurrency(data.remainingAmount)} VNĐ</p>
  </div>

  <div class="section-title">ĐIỀU 3: NHẬN XE</div>
  <p>Địa chỉ giao: ${data.deliveryAddress || data.dealershipAddress}</p>
  <p>Ngày dự kiến: ${data.deliveryDate ? formatDate(data.deliveryDate) : 'Theo thỏa thuận'}</p>

  ${data.notes ? `<div class="section-title">Ghi chú</div><p>${data.notes}</p>` : ''}

  <table style="margin-top: 40px;">
    <tr>
      <th style="width:50%">ĐẠI DIỆN BÊN A</th>
      <th>ĐẠI DIỆN BÊN B</th>
    </tr>
    <tr>
      <td style="height:80px; vertical-align: bottom;">(Ký, ghi rõ họ tên)</td>
      <td style="vertical-align: bottom;">(Ký, ghi rõ họ tên)</td>
    </tr>
  </table>
</body>
</html>
  `;

  const element = document.createElement('div');
  element.innerHTML = htmlContent;
  
  const opt = {
    margin: [15, 15, 15, 15] as [number, number, number, number],
    filename: `Hop-dong-${data.contractCode}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
  };

  await html2pdf().set(opt).from(element).save();
};

/**
 * Download a PDF blob as a file
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
 */
export const generateContractFilename = (orderCode: string, date?: Date): string => {
  const now = date || new Date();
  const dateStr = now.toISOString().split('T')[0];
  return `Hop-dong-${orderCode}-${dateStr}.pdf`;
};

/**
 * Helper: Map Order data from backend to Contract PDF format
 */
export const mapOrderToContractPDF = (
  order: any,
  dealershipInfo?: {
    company_name?: string;
    address?: any;
    contact?: any;
    contract?: any;
  }
): ContractPDFData => {
  const customer = typeof order.customer_id === 'object' ? order.customer_id : {};
  const dealership = dealershipInfo || (typeof order.dealership_id === 'object' ? order.dealership_id : {});
  
  return {
    contractCode: order.code || `HD${Date.now()}`,
    customerName: customer.full_name || 'N/A',
    customerPhone: customer.phone || 'N/A',
    customerEmail: customer.email || 'N/A',
    customerAddress: customer.address || 'N/A',
    dealershipName: dealership.company_name || 'Đại lý xe điện',
    dealershipAddress: dealership.address?.full_address || dealership.address || 'N/A',
    dealershipPhone: dealership.contact?.phone || 'N/A',
    dealershipTaxCode: dealership.tax_code || 'N/A',
    representative: dealership.legal_representative || 'Đại diện đại lý',
    items: order.items?.map((item: any) => ({
      vehicleName: item.vehicle_name || 'N/A',
      color: item.color || '',
      quantity: item.quantity || 1,
      unitPrice: item.vehicle_price || 0,
      accessories: item.accessories || [],
      options: item.options || [],
      discount: item.discount || 0,
      finalAmount: item.final_amount || 0,
    })) || [],
    totalAmount: order.final_amount || 0,
    paidAmount: order.paid_amount || 0,
    remainingAmount: (order.final_amount || 0) - (order.paid_amount || 0),
    paymentMethod: order.payment_method || 'cash',
    deliveryAddress: order.delivery?.delivery_address?.full_address || dealership.address?.full_address,
    deliveryDate: order.delivery?.scheduled_date ? new Date(order.delivery.scheduled_date) : undefined,
    notes: order.notes,
  };
};

/**
 * Helper: Map Quote data from backend to Quote PDF format
 */
export const mapQuoteToQuotePDF = (
  quote: any,
  dealershipInfo?: any
): QuotePDFData => {
  const customer = typeof quote.customer === 'object' ? quote.customer : {};
  const dealership = dealershipInfo || {};
  
  return {
    quoteCode: quote.code || `QTE${Date.now()}`,
    customerName: customer.full_name || 'N/A',
    customerPhone: customer.phone || 'N/A',
    customerEmail: customer.email || 'N/A',
    customerAddress: customer.address || 'N/A',
    dealershipName: dealership.company_name || 'Đại lý xe điện',
    dealershipAddress: dealership.address?.full_address || dealership.address || 'N/A',
    items: quote.items?.map((item: any) => ({
      vehicleName: item.vehicle_name || 'N/A',
      color: item.color || '',
      quantity: item.quantity || 1,
      unitPrice: item.vehicle_price || 0,
      accessories: item.accessories || [],
      options: item.options || [],
      discount: item.discount || 0,
      finalAmount: item.final_amount || 0,
    })) || [],
    totalAmount: quote.final_amount || 0,
    notes: quote.notes,
    validUntil: quote.endDate ? new Date(quote.endDate) : undefined,
  };
};
