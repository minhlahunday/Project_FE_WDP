import html2pdf from 'html2pdf.js';
import { get } from '../services/httpClient';

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
  contractLocation?: string; // Địa điểm
  items: Array<{
    vehicleName: string;
    color?: string;
    quantity: number;
    unitPrice: number;
    accessories?: Array<{ name: string; quantity: number; price: number }>;
    options?: Array<{ name: string; quantity?: number; price: number }>;
    promotion?: string; // Khuyến mãi
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
 * Convert number to Vietnamese words
 */
const numberToWords = (num: number): string => {
  if (num === 0) return 'không đồng';
  
  let result = '';
  let remaining = num;
  
  const billions = Math.floor(remaining / 1000000000);
  if (billions > 0) {
    result += readGroup(billions) + ' tỷ ';
    remaining = remaining % 1000000000;
  }
  
  const millions = Math.floor(remaining / 1000000);
  if (millions > 0) {
    result += readGroup(millions) + ' triệu ';
    remaining = remaining % 1000000;
  }
  
  const thousands = Math.floor(remaining / 1000);
  if (thousands > 0) {
    result += readGroup(thousands) + ' nghìn ';
    remaining = remaining % 1000;
  }
  
  if (remaining > 0) {
    result += readGroup(remaining);
  }
  
  return result.trim() + ' đồng';
};

const readGroup = (num: number): string => {
  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
  const hundreds = ['', 'một trăm', 'hai trăm', 'ba trăm', 'bốn trăm', 'năm trăm', 'sáu trăm', 'bảy trăm', 'tám trăm', 'chín trăm'];
  
  if (num === 0) return '';
  if (num < 10) return ones[num];
  if (num < 20) {
    if (num === 10) return 'mười';
    return 'mười ' + ones[num % 10];
  }
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    if (one === 0) return tens[ten];
    if (one === 5) return tens[ten] + ' lăm';
    if (one === 1) return tens[ten] + ' mốt';
    return tens[ten] + ' ' + ones[one];
  }
  
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  if (remainder === 0) return hundreds[hundred];
  return hundreds[hundred] + ' ' + readGroup(remainder);
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
    ${((): string => {
      let rowIndex = 1;
      const rows: string[] = [];
      
      data.items.forEach((item) => {
        const vehicleAmount = item.unitPrice * item.quantity;
        
        // Vehicle row
        rows.push(`
          <tr>
            <td style="text-align: center;">${rowIndex++}</td>
            <td>
              ${item.vehicleName}${item.color ? ' (Màu ' + item.color + ')' : ''}
            </td>
            <td style="text-align: center;">Chiếc</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
            <td style="text-align: right;">${formatCurrency(vehicleAmount)}</td>
          </tr>
        `);
        
        // Accessories rows
        if (item.accessories && item.accessories.length > 0) {
          item.accessories.forEach((acc) => {
            const accAmount = acc.price * acc.quantity;
            rows.push(`
              <tr>
                <td style="text-align: center;">${rowIndex++}</td>
                <td>${acc.name}</td>
                <td style="text-align: center;">Chiếc</td>
                <td style="text-align: center;">${acc.quantity}</td>
                <td style="text-align: right;">${formatCurrency(acc.price)}</td>
                <td style="text-align: right;">${formatCurrency(accAmount)}</td>
              </tr>
            `);
          });
        }
        
        // Options rows
        if (item.options && item.options.length > 0) {
          item.options.forEach((opt: any) => {
            const optQuantity = (opt as any).quantity || 1;
            const optAmount = opt.price * optQuantity;
            rows.push(`
              <tr>
                <td style="text-align: center;">${rowIndex++}</td>
                <td>${opt.name}</td>
                <td style="text-align: center;">Bộ</td>
                <td style="text-align: center;">${optQuantity}</td>
                <td style="text-align: right;">${formatCurrency(opt.price)}</td>
                <td style="text-align: right;">${formatCurrency(optAmount)}</td>
              </tr>
            `);
          });
        }
      });
      
      return `
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">STT</th>
              <th style="width: 40%;">Tên hàng hóa, dịch vụ</th>
              <th style="width: 10%;">Đơn vị tính</th>
              <th style="width: 10%;">Số lượng</th>
              <th style="width: 15%;">Đơn giá</th>
              <th style="width: 20%;">Thành tiền</th>
            </tr>
            <tr>
              <th colspan="6" style="text-align: right; font-weight: normal; font-size: 9px;">(Thành tiền = Số lượng × Đơn giá)</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: right; font-weight: bold; padding: 10px 8px; border-top: 2px solid #333;">Tổng cộng:</td>
              <td style="text-align: right; font-weight: bold; padding: 10px 8px; border-top: 2px solid #333; color: #d93025; font-size: 13px;">${formatCurrency(data.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    })()}
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
  const now = new Date();
  const location = data.contractLocation || 'Hồ Chí Minh';
  const dateStr = `Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  
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
      font-weight: normal;
    }
    h1 {
      font-size: 18px;
      color: #1a73e8;
      margin: 10px 0;
      font-weight: bold;
    }
    .section-title {
      font-weight: bold;
      font-size: 13px;
      margin: 15px 0 10px 0;
      color: #1a73e8;
    }
    .vehicle-section {
      margin-bottom: 20px;
      padding: 10px;
      border: 1px solid #ddd;
      background-color: #fafafa;
    }
    .vehicle-title {
      font-weight: bold;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .vehicle-detail {
      margin: 5px 0;
      padding-left: 15px;
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
      text-align: left;
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
    .article-content {
      margin: 10px 0;
      padding-left: 15px;
    }
    .article-content ol {
      margin: 5px 0;
      padding-left: 25px;
    }
    .article-content li {
      margin: 8px 0;
    }
    .signature-section {
      margin-top: 40px;
    }
    .note-section {
      margin-top: 20px;
      font-style: italic;
      font-size: 10px;
    }
    .date-section {
      text-align: center;
      margin-top: 20px;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
    <h2>Độc Lập – Tự Do – Hạnh Phúc</h2>
    <h1>HỢP ĐỒNG MUA BÁN XE ĐIỆN</h1>
    <p>Số hợp đồng: <strong>${data.contractCode}</strong></p>
    <p>Địa điểm: ${location}, ${dateStr}</p>
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
  ${((): string => {
    // Calculate total goods amount first
    let totalGoodsAmount = 0;
    let rowIndex = 1;
    const rows: string[] = [];
    
    data.items.forEach((item) => {
      const vehicleAmount = item.unitPrice * item.quantity;
      totalGoodsAmount += vehicleAmount;
      
      // Vehicle row
      rows.push(`
        <tr>
          <td style="text-align: center;">${rowIndex++}</td>
          <td>
            ${item.vehicleName}${item.color ? ' (Màu ' + item.color + ')' : ''}
            ${item.promotion ? '<br/><small>Khuyến mãi: ' + item.promotion + '</small>' : ''}
          </td>
          <td style="text-align: center;">Chiếc</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
          <td style="text-align: right;">${formatCurrency(vehicleAmount)}</td>
        </tr>
      `);
      
      // Accessories rows
      if (item.accessories && item.accessories.length > 0) {
        item.accessories.forEach((acc) => {
          const accAmount = acc.price * acc.quantity;
          totalGoodsAmount += accAmount;
          rows.push(`
            <tr>
              <td style="text-align: center;">${rowIndex++}</td>
              <td>${acc.name}</td>
              <td style="text-align: center;">Chiếc</td>
              <td style="text-align: center;">${acc.quantity}</td>
              <td style="text-align: right;">${formatCurrency(acc.price)}</td>
              <td style="text-align: right;">${formatCurrency(accAmount)}</td>
            </tr>
          `);
        });
      }
      
      // Options rows
      if (item.options && item.options.length > 0) {
        item.options.forEach((opt) => {
          const optQuantity = opt.quantity || 1;
          const optAmount = opt.price * optQuantity;
          totalGoodsAmount += optAmount;
          rows.push(`
            <tr>
              <td style="text-align: center;">${rowIndex++}</td>
              <td>${opt.name}</td>
              <td style="text-align: center;">Bộ</td>
              <td style="text-align: center;">${optQuantity}</td>
              <td style="text-align: right;">${formatCurrency(opt.price)}</td>
              <td style="text-align: right;">${formatCurrency(optAmount)}</td>
            </tr>
          `);
        });
      }
    });
    
    // Use totalAmount from data or calculated total
    const finalTotalAmount = data.totalAmount || totalGoodsAmount;
    
    return `
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">STT</th>
            <th style="width: 40%;">Tên hàng hóa, dịch vụ</th>
            <th style="width: 10%;">Đơn vị tính</th>
            <th style="width: 10%;">Số lượng</th>
            <th style="width: 15%;">Đơn giá</th>
            <th style="width: 20%;">Thành tiền</th>
          </tr>
          <tr>
            <th colspan="6" style="text-align: right; font-weight: normal; font-size: 9px;">(Thành tiền = Số lượng × Đơn giá)</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" style="text-align: right; font-weight: bold; padding: 10px 8px; border-top: 2px solid #333;">Tổng cộng tiền thanh toán:</td>
            <td style="text-align: right; font-weight: bold; padding: 10px 8px; border-top: 2px solid #333; color: #d93025; font-size: 13px;">${formatCurrency(finalTotalAmount)}</td>
          </tr>
          <tr>
            <td colspan="6" style="padding: 10px 8px; font-style: italic;">
              <strong>Số tiền viết bằng chữ:</strong> ${numberToWords(finalTotalAmount)}
            </td>
          </tr>
        </tfoot>
      </table>
    `;
  })()}

  <div class="payment-info">
    <p>Phương thức thanh toán: ${data.paymentMethod === 'installment' ? 'Thanh toán trả góp' : 'Thanh toán tiền mặt'}</p>
    <p>Đã thanh toán: ${formatCurrency(data.paidAmount)} VNĐ</p>
    <p class="amount-highlight">Còn lại: ${formatCurrency(data.remainingAmount)} VNĐ</p>
  </div>

  <div class="section-title">ĐIỀU 3: NHẬN XE</div>
  <div class="article-content">
    <p>Xe sẽ được giao tại địa chỉ đại lý: ${data.dealershipAddress}</p>
    <p>Hoặc giao xe đến địa chỉ của khách hàng theo thỏa thuận.</p>
    <p>Ngày giao xe dự kiến: ${data.deliveryDate ? formatDate(data.deliveryDate) : 'Theo thỏa thuận.'}</p>
    <p>Khách hàng chịu trách nhiệm nhận xe và các giấy tờ liên quan.</p>
  </div>

  <div class="section-title">ĐIỀU 4: BẢO HÀNH VÀ TRÁCH NHIỆM</div>
  <div class="article-content">
    <ol>
      <li>Bên A cam kết cung cấp bảo hành chính hãng theo quy định.</li>
      <li>Bên B có trách nhiệm sử dụng xe đúng hướng dẫn và bảo quản xe.</li>
      <li>Bên B chịu mọi thiệt hại khi sử dụng pin và thiết bị sạc không chính hãng.</li>
      <li>Mọi tranh chấp sẽ được giải quyết thông qua đàm phán, hòa giải.</li>
    </ol>
  </div>

  <div class="section-title">ĐIỀU 5: CHUYỂN RỦI RO VÀ QUYỀN SỞ HỮU</div>
  <div class="article-content">
    <p>Toàn bộ quyền sở hữu, rủi ro và lợi ích liên quan đến xe sẽ chuyển giao cho Khách hàng khi xe được bàn giao hoặc khi Khách hàng thanh toán đầy đủ giá trị hợp đồng.</p>
  </div>

  <div class="section-title">ĐIỀU 6: BẢO VỆ DỮ LIỆU CÁ NHÂN</div>
  <div class="article-content">
    <p>Khách hàng đồng ý cho bên bán xử lý dữ liệu cá nhân liên quan đến việc vận hành, bảo trì và các tính năng thông minh của xe theo quy định pháp luật hiện hành.</p>
  </div>

  <div class="section-title">ĐIỀU 7: CÁC ĐIỀU KHOẢN KHÁC</div>
  <div class="article-content">
    <ol>
      <li>Hợp đồng có hiệu lực kể từ ngày ký.</li>
      <li>Mọi thay đổi hợp đồng phải được thỏa thuận bằng văn bản.</li>
      <li>Hợp đồng được lập thành 2 bản có giá trị pháp lý như nhau.</li>
    </ol>
  </div>

  ${data.notes ? `
    <div class="note-section">
      <p><strong>GHI CHÚ:</strong> ${data.notes}</p>
    </div>
  ` : ''}

  <div class="signature-section">
    <table>
    <tr>
      <th style="width:50%">ĐẠI DIỆN BÊN A</th>
      <th>ĐẠI DIỆN BÊN B</th>
    </tr>
    <tr>
      <td style="height:80px; vertical-align: bottom;">(Ký, ghi rõ họ tên)</td>
      <td style="vertical-align: bottom;">(Ký, ghi rõ họ tên)</td>
    </tr>
  </table>
    <div class="date-section">
      <p>Ngày đồng ý</p>
    </div>
  </div>
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
 * Helper: Fetch dealership info from API
 */
const fetchDealershipInfo = async (dealershipId: string | undefined): Promise<any> => {
  if (!dealershipId || typeof dealershipId !== 'string') {
    return null;
  }
  
  try {
    const response = await get<any>(`/api/dealerships/${dealershipId}`);
    if (response?.success && response?.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching dealership info:', error);
    return null;
  }
};

/**
 * Helper: Map Order data from backend to Contract PDF format (sync version, no API fetch)
 */
const mapOrderToContractPDFSync = (
  order: any,
  dealershipInfo?: {
    company_name?: string;
    name?: string;
    address?: any;
    contact?: any;
    contract?: any;
    tax_code?: string;
    legal_representative?: string;
    phone?: string;
    email?: string;
  }
): ContractPDFData => {
  const customer = typeof order.customer_id === 'object' ? order.customer_id : {};
  
  // Try multiple sources for dealership info
  let dealership: any = {};
  
  // Priority 1: dealershipInfo parameter
  if (dealershipInfo) {
    dealership = dealershipInfo;
  }
  // Priority 2: order.dealership (populated)
  else if (order.dealership && typeof order.dealership === 'object') {
    dealership = order.dealership;
  }
  // Priority 3: order.dealership_id (if populated as object)
  else if (order.dealership_id && typeof order.dealership_id === 'object') {
    dealership = order.dealership_id;
  }
  
  // Helper function to get nested address
  const getAddress = (addr: any): string => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    if (addr.full_address) return addr.full_address;
    if (addr.street && addr.district && addr.city) {
      return `${addr.street}, ${addr.ward || ''}, ${addr.district}, ${addr.city}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
    }
    return 'N/A';
  };
  
  // Helper function to get phone
  const getPhone = (contact: any): string => {
    if (!contact) return 'N/A';
    if (typeof contact === 'string') return contact;
    if (contact.phone) return contact.phone;
    return 'N/A';
  };
  
  // Get dealership name (try multiple fields)
  const dealershipName = dealership.company_name || dealership.name || dealership.dealership_name || 'Đại lý xe điện';
  
  // Get address
  const dealershipAddress = getAddress(dealership.address);
  
  // Get phone
  const dealershipPhone = getPhone(dealership.contact) || dealership.phone || 'N/A';
  
  // Get tax code
  const dealershipTaxCode = dealership.tax_code || dealership.mst || 'N/A';
  
  // Get representative
  const representative = dealership.legal_representative || dealership.representative || dealership.manager_name || 'Đại diện đại lý';
  
  // Get location (city)
  const getLocation = (): string => {
    if (dealership.address?.city) return dealership.address.city;
    if (dealership.address?.province) return dealership.address.province;
    if (dealership.city) return dealership.city;
    return 'Hồ Chí Minh';
  };
  
  return {
    contractCode: order.code || `HD${Date.now()}`,
    customerName: customer.full_name || 'N/A',
    customerPhone: customer.phone || 'N/A',
    customerEmail: customer.email || 'N/A',
    customerAddress: typeof customer.address === 'string' ? customer.address : getAddress(customer.address),
    dealershipName,
    dealershipAddress,
    dealershipPhone,
    dealershipTaxCode,
    representative,
    contractLocation: getLocation(),
    items: order.items?.map((item: any) => ({
      vehicleName: item.vehicle_name || 'N/A',
      color: item.color || '',
      quantity: item.quantity || 1,
      unitPrice: item.vehicle_price || 0,
      accessories: item.accessories || [],
      options: item.options?.map((opt: any) => ({
        name: opt.name || opt.option_name || 'N/A',
        quantity: opt.quantity || 1,
        price: opt.price || opt.option_price || 0,
      })) || [],
      promotion: item.promotion || item.promotion_name || undefined,
      discount: item.discount || 0,
      finalAmount: item.final_amount || 0,
    })) || [],
    totalAmount: order.final_amount || 0,
    paidAmount: order.paid_amount || 0,
    remainingAmount: (order.final_amount || 0) - (order.paid_amount || 0),
    paymentMethod: order.payment_method || 'cash',
    deliveryAddress: order.delivery?.delivery_address?.full_address || getAddress(dealership.address),
    deliveryDate: order.delivery?.scheduled_date ? new Date(order.delivery.scheduled_date) : undefined,
    notes: order.notes,
  };
};

/**
 * Helper: Map Order data from backend to Contract PDF format (async version with API fetch)
 * This function will automatically try to fetch dealership info if not available in order
 */
export const mapOrderToContractPDF = async (
  order: any,
  dealershipInfo?: {
    company_name?: string;
    name?: string;
    address?: any;
    contact?: any;
    contract?: any;
    tax_code?: string;
    legal_representative?: string;
    phone?: string;
    email?: string;
  }
): Promise<ContractPDFData> => {
  // If dealershipInfo is provided or dealership is already populated, use sync version
  if (dealershipInfo || 
      (order.dealership && typeof order.dealership === 'object') ||
      (order.dealership_id && typeof order.dealership_id === 'object')) {
    return mapOrderToContractPDFSync(order, dealershipInfo);
  }
  
  // Otherwise, try to fetch from API if dealership_id is a string
  if (order.dealership_id && typeof order.dealership_id === 'string') {
    const fetchedDealership = await fetchDealershipInfo(order.dealership_id);
    if (fetchedDealership) {
      return mapOrderToContractPDFSync(order, fetchedDealership);
    }
  }
  
  // Fallback to sync version (will use defaults)
  return mapOrderToContractPDFSync(order, dealershipInfo);
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
