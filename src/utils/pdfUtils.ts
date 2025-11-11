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
    options?: Array<{ name: string; quantity?: number; price: number }>;
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
        <p>Tên đại lý: ${data.dealershipName || 'N/A'}</p>
        <p>Địa chỉ: ${data.dealershipAddress && data.dealershipAddress !== 'N/A' ? data.dealershipAddress : 'N/A'}</p>
        <p>Điện thoại: ${data.dealershipPhone && data.dealershipPhone !== 'N/A' ? data.dealershipPhone : 'N/A'}</p>
        <p>MST: ${data.dealershipTaxCode && data.dealershipTaxCode !== 'N/A' ? data.dealershipTaxCode : 'N/A'}</p>
        <p>Người đại diện: ${data.representative || 'N/A'}</p>
      </td>
      <td>
        <p>Họ và tên: ${data.customerName && data.customerName !== 'N/A' ? data.customerName : 'N/A'}</p>
        <p>Địa chỉ: ${data.customerAddress && data.customerAddress !== 'N/A' ? data.customerAddress : 'N/A'}</p>
        <p>Điện thoại: ${data.customerPhone && data.customerPhone !== 'N/A' ? data.customerPhone : 'N/A'}</p>
        <p>Email: ${data.customerEmail && data.customerEmail !== 'N/A' ? data.customerEmail : 'N/A'}</p>
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
    <p>Xe sẽ được giao tại địa chỉ đại lý: ${data.deliveryAddress && data.deliveryAddress !== 'N/A' ? data.deliveryAddress : (data.dealershipAddress && data.dealershipAddress !== 'N/A' ? data.dealershipAddress : 'Theo thỏa thuận')}</p>
    <p>Hoặc giao xe đến địa chỉ của khách hàng theo thỏa thuận.</p>
    <p>Ngày giao xe dự kiến: ${data.deliveryDate ? formatDate(data.deliveryDate) : 'Theo thỏa thuận.'}</p>
    <p>Khách hàng chịu trách nhiệm nhận xe và các giấy tờ liên quan.</p>
  </div>

  <br>
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
      <p>Ngày ký : </p>
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
    console.log('[fetchDealershipInfo] Fetching dealership:', dealershipId);
    const response = await get<any>(`/api/dealerships/${dealershipId}`);
    console.log('[fetchDealershipInfo] Raw API response:', response);
    console.log('[fetchDealershipInfo] Response type:', typeof response);
    console.log('[fetchDealershipInfo] Response keys:', Object.keys(response || {}));
    
    // httpClient.get returns response.data, so response structure is:
    // { status: 200, success: true, message: "...", data: { ... } }
    if (response && response.success && response.data) {
      // Response structure: { success: true, data: { ... } }
      console.log('[fetchDealershipInfo] ✅ Fetched dealership info:', response.data);
      console.log('[fetchDealershipInfo] Dealership address:', response.data.address);
      return response.data;
    } else if (response && typeof response === 'object' && !response.success) {
      // Response is direct data object (no wrapper)
      console.log('[fetchDealershipInfo] ✅ Fetched dealership info (direct):', response);
      return response;
    }
    
    console.warn('[fetchDealershipInfo] ❌ Unexpected response structure:', response);
    return null;
  } catch (error) {
    console.error('[fetchDealershipInfo] ❌ Error fetching dealership info:', error);
    return null;
  }
};

/**
 * Helper: Fetch customer info from API
 */
const fetchCustomerInfo = async (customerId: string | undefined): Promise<any> => {
  if (!customerId || typeof customerId !== 'string') {
    return null;
  }
  
  try {
    console.log('[fetchCustomerInfo] Fetching customer:', customerId);
    const response = await get<any>(`/api/customers/${customerId}`);
    console.log('[fetchCustomerInfo] Raw API response:', response);
    console.log('[fetchCustomerInfo] Response type:', typeof response);
    console.log('[fetchCustomerInfo] Response keys:', Object.keys(response || {}));
    
    // httpClient.get returns response.data, so response structure is:
    // { status: 200, success: true, message: "...", data: { ... } }
    if (response && response.success && response.data) {
      // Response structure: { success: true, data: { ... } }
      console.log('[fetchCustomerInfo] ✅ Fetched customer info:', response.data);
      console.log('[fetchCustomerInfo] Customer address:', response.data.address);
      return response.data;
    } else if (response && typeof response === 'object' && !response.success) {
      // Response is direct data object (no wrapper)
      console.log('[fetchCustomerInfo] ✅ Fetched customer info (direct):', response);
      return response;
    }
    
    console.warn('[fetchCustomerInfo] ❌ Unexpected response structure:', response);
    return null;
  } catch (error) {
    console.error('[fetchCustomerInfo] ❌ Error fetching customer info:', error);
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
  // Get customer info - try multiple sources (giống như mapQuoteToQuotePDF)
  let customer: any = {};
  if (order.customer && typeof order.customer === 'object') {
    customer = order.customer;
    console.log('[mapOrderToContractPDFSync] Using order.customer:', customer);
  } else if (order.customer_id && typeof order.customer_id === 'object') {
    customer = order.customer_id;
    console.log('[mapOrderToContractPDFSync] Using order.customer_id:', customer);
  } else {
    // Nếu customer_id là string, sẽ được fetch trong mapOrderToContractPDF
    console.warn('[mapOrderToContractPDFSync] No customer info found in order, will be fetched in async function');
    customer = {};
  }
  
  // Try multiple sources for dealership info
  let dealership: any = {};
  
  // Priority 1: dealershipInfo parameter
  if (dealershipInfo) {
    dealership = dealershipInfo;
    console.log('[mapOrderToContractPDFSync] Using dealershipInfo parameter:', dealership);
  }
  // Priority 2: order.dealership (populated)
  else if (order.dealership && typeof order.dealership === 'object') {
    dealership = order.dealership;
    console.log('[mapOrderToContractPDFSync] Using order.dealership:', dealership);
  }
  // Priority 3: order.dealership_id (if populated as object)
  else if (order.dealership_id && typeof order.dealership_id === 'object') {
    dealership = order.dealership_id;
    console.log('[mapOrderToContractPDFSync] Using order.dealership_id:', dealership);
  } else {
    console.warn('[mapOrderToContractPDFSync] No dealership info found in order or parameter');
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
  
  // Get dealership name - theo API structure
  const dealershipName = dealership.company_name || dealership.name || 'Đại lý xe điện';
  
  // Get address - theo API structure: address.full_address hoặc address object (giống như mapQuoteToQuotePDF)
  let dealershipAddress = 'N/A';
  if (dealership && dealership.address) {
    if (dealership.address.full_address && typeof dealership.address.full_address === 'string' && dealership.address.full_address.trim() !== '') {
      dealershipAddress = dealership.address.full_address;
    } else if (typeof dealership.address === 'string' && dealership.address.trim() !== '') {
      dealershipAddress = dealership.address;
    } else if (typeof dealership.address === 'object') {
      // Nếu address là object, dùng getAddress
      dealershipAddress = getAddress(dealership.address);
    }
  }
  
  console.log('[mapOrderToContractPDFSync] Dealership address check:', {
    hasAddress: !!dealership?.address,
    addressType: typeof dealership?.address,
    fullAddress: dealership?.address?.full_address,
    dealershipAddress
  });
  
  // Get phone - theo API structure: contact.phone
  let dealershipPhone = 'N/A';
  if (dealership.contact && dealership.contact.phone) {
    dealershipPhone = dealership.contact.phone;
  } else if (dealership.phone) {
    dealershipPhone = dealership.phone;
  }
  
  // Get tax code - theo API structure: tax_code
  let dealershipTaxCode = 'N/A';
  if (dealership.tax_code) {
    dealershipTaxCode = dealership.tax_code;
  } else if (dealership.mst) {
    dealershipTaxCode = dealership.mst;
  }
  
  // Get representative - theo API structure: legal_representative
  let representative = 'Đại diện đại lý';
  if (dealership.legal_representative) {
    representative = dealership.legal_representative;
  } else if (dealership.representative) {
    representative = dealership.representative;
  }
  
  // Get location (city)
  const getLocation = (): string => {
    if (dealership.address?.city) return dealership.address.city;
    if (dealership.address?.province) return dealership.address.province;
    if (dealership.city) return dealership.city;
    return 'Hồ Chí Minh';
  };
  
  // Get customer address - customer.address is a string in API response (giống như mapQuoteToQuotePDF)
  // Kiểm tra kỹ hơn: customer.address có thể là string, null, undefined, hoặc empty string
  let customerAddress = 'N/A';
  if (customer && customer.address) {
    if (typeof customer.address === 'string' && customer.address.trim() !== '') {
      customerAddress = customer.address;
    } else if (typeof customer.address === 'object') {
      // Nếu address là object, dùng getAddress
      customerAddress = getAddress(customer.address);
    }
  }
  
  console.log('[mapOrderToContractPDFSync] Customer info:', {
    full_name: customer?.full_name,
    phone: customer?.phone,
    email: customer?.email,
    address: customer?.address,
    addressType: typeof customer?.address,
    customerAddress
  });
  
  console.log('[mapOrderToContractPDFSync] Dealership info:', {
    company_name: dealershipName,
    address: dealershipAddress,
    phone: dealershipPhone,
    tax_code: dealershipTaxCode,
    representative
  });
  
  return {
    contractCode: order.code || `HD${Date.now()}`,
    customerName: customer.full_name || 'N/A',
    customerPhone: customer.phone || 'N/A',
    customerEmail: customer.email || 'N/A',
    customerAddress,
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
    deliveryAddress: order.delivery?.delivery_address?.full_address || 
                     (order.delivery?.delivery_address ? getAddress(order.delivery.delivery_address) : null) ||
                     getAddress(dealership.address),
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
  // Fetch dealership info - ALWAYS fetch from API to get full info (including address, contact, tax_code)
  // Backend getOrderById only populates: company_name (missing address, contact, tax_code, legal_representative!)
  let finalDealershipInfo = dealershipInfo;
  
  // Get dealership ID (could be string or populated object)
  let dealershipId: string | null = null;
  if (dealershipInfo && (dealershipInfo as any)._id) {
    dealershipId = (dealershipInfo as any)._id;
  } else if (typeof order.dealership_id === 'string') {
    dealershipId = order.dealership_id;
  } else if (order.dealership_id && typeof order.dealership_id === 'object' && order.dealership_id._id) {
    dealershipId = order.dealership_id._id;
  } else if (order.dealership && typeof order.dealership === 'object' && order.dealership._id) {
    dealershipId = order.dealership._id;
  }
  
  if (dealershipId) {
    // Check if dealership already has full info (address, contact, tax_code)
    const existingDealership = finalDealershipInfo || order.dealership || (order.dealership_id && typeof order.dealership_id === 'object' ? order.dealership_id : null);
    const hasFullDealershipInfo = existingDealership && existingDealership.address && existingDealership.contact && existingDealership.tax_code;
    
    if (!hasFullDealershipInfo) {
      console.log('[mapOrderToContractPDF] Dealership populated but missing full info, fetching full dealership info for:', dealershipId);
      const fetchedDealership = await fetchDealershipInfo(dealershipId);
      if (fetchedDealership) {
        console.log('[mapOrderToContractPDF] ✅ Fetched full dealership info:', fetchedDealership);
        console.log('[mapOrderToContractPDF] Dealership address:', fetchedDealership.address);
        finalDealershipInfo = fetchedDealership;
      } else {
        console.warn('[mapOrderToContractPDF] ❌ Failed to fetch dealership info, using existing data');
      }
    } else {
      console.log('[mapOrderToContractPDF] Dealership already has full info (including address, contact, tax_code)');
    }
  } else {
    console.warn('[mapOrderToContractPDF] ❌ No dealership_id found in order');
  }
  
  // Fetch customer info - ALWAYS fetch from API to get full info (including address)
  // Backend getOrderById only populates: full_name, email, phone (missing address!)
  let enrichedOrder = { ...order };
  
  // Get customer ID (could be string or populated object)
  let customerId: string | null = null;
  if (typeof order.customer_id === 'string') {
    customerId = order.customer_id;
  } else if (order.customer_id && typeof order.customer_id === 'object' && order.customer_id._id) {
    customerId = order.customer_id._id;
  } else if (order.customer && typeof order.customer === 'object' && order.customer._id) {
    customerId = order.customer._id;
  }
  
  if (customerId) {
    // Check if customer already has address (full info)
    const existingCustomer = order.customer || (order.customer_id && typeof order.customer_id === 'object' ? order.customer_id : null);
    const hasFullCustomerInfo = existingCustomer && existingCustomer.address;
    
    if (!hasFullCustomerInfo) {
      console.log('[mapOrderToContractPDF] Customer populated but missing address, fetching full customer info for:', customerId);
      const fetchedCustomer = await fetchCustomerInfo(customerId);
      if (fetchedCustomer) {
        console.log('[mapOrderToContractPDF] ✅ Fetched full customer info:', fetchedCustomer);
        console.log('[mapOrderToContractPDF] Customer address:', fetchedCustomer.address);
        enrichedOrder.customer = fetchedCustomer;
      } else {
        console.warn('[mapOrderToContractPDF] ❌ Failed to fetch customer info, using existing data');
      }
    } else {
      console.log('[mapOrderToContractPDF] Customer already has full info (including address)');
    }
  } else {
    console.warn('[mapOrderToContractPDF] ❌ No customer_id found in order');
  }
  
  return mapOrderToContractPDFSync(enrichedOrder, finalDealershipInfo);
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
