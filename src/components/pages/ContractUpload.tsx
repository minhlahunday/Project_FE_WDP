import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Paper,
  Divider,
  Alert,
  LinearProgress,
  Stack,
  TextField,
  FormControl,
  FormLabel,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Visibility as EyeIcon,
  Description as FileImageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import Swal from 'sweetalert2';
import { message } from 'antd';

// Import services and types (Giả định đã có)
import { orderService } from '../../services/orderService';
import { contractService } from '../../services/contractService';
import { Order } from '../../types/index';

// --- Khai báo Types cho File Upload ---
interface CustomUploadFile {
  uid: string;
  name: string;
  size: number;
  originFileObj: File;
  status: 'error' | 'success' | 'uploading' | 'done';
}

interface ContractUploadProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

// --- Khai báo Helper Functions ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

// --- Component Chính (ContractUpload) ---
export const ContractUpload: React.FC<ContractUploadProps> = ({
  visible,
  order,
  onClose,
  onSuccess,
}) => {
  // State của Form
  const [uploadDate, setUploadDate] = useState<Dayjs | null>(dayjs());
  const [notes, setNotes] = useState('');

  // State Upload
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<CustomUploadFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Logic Reset ---
  useEffect(() => {
    if (visible && order) {
      // Thiết lập giá trị mặc định cho form
      setUploadDate(dayjs());
      setNotes(`Hợp đồng đã ký - Đơn hàng ${order.code}`);
      setFileList([]);
      setUploadProgress(0);
    } else {
      // Reset khi đóng
      setUploadDate(null);
      setNotes('');
      setFileList([]);
      setUploadProgress(0);
    }
  }, [visible, order]);

  // --- Logic Xử lý File ---

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: CustomUploadFile[] = [];
    const errors: string[] = [];

    // Xử lý từng file
    Array.from(files).forEach((file) => {
      const isImageOrPdf = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isLt10M = file.size / 1024 / 1024 < 10;

      if (!isImageOrPdf) {
        errors.push(`${file.name}: Chỉ hỗ trợ file ảnh và PDF!`);
        return;
      }
      if (!isLt10M) {
        errors.push(`${file.name}: File phải nhỏ hơn 10MB!`);
        return;
      }

      // Kiểm tra trùng tên
      const isDuplicate = fileList.some(f => f.name === file.name);
      if (isDuplicate) {
        errors.push(`${file.name}: File đã được chọn!`);
        return;
      }

      newFiles.push({
        uid: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        originFileObj: file,
        status: 'done',
      });
    });

    // Hiển thị lỗi nếu có
    if (errors.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Lỗi khi chọn file',
        html: errors.join('<br>'),
        confirmButtonText: 'Đóng'
      });
    }

    // Thêm các file hợp lệ vào danh sách
    if (newFiles.length > 0) {
      setFileList(prev => [...prev, ...newFiles]);
    }

    // Reset input để cho phép chọn lại cùng một file nếu cần
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const openFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (uid: string) => {
    setFileList(prev => prev.filter(file => file.uid !== uid));
  };

  const handlePreview = async (file: CustomUploadFile) => {
    if (file.originFileObj.type.includes('pdf')) {
        Swal.fire({
          icon: 'info',
          title: 'File PDF',
          text: 'Vui lòng Tải xuống để xem.',
          confirmButtonText: 'Đóng'
        });
        return;
    }
    
    // Nếu là ảnh, hiển thị trong SweetAlert
    const previewUrl = (file as any).url || (file as any).preview || await getBase64(file.originFileObj);
    Swal.fire({
      title: `Xem trước: ${file.name}`,
      imageUrl: previewUrl,
      imageWidth: '80%',
      imageAlt: file.name,
      showCloseButton: true,
      showConfirmButton: false
    });
  };

  // --- Logic Submit ---
  const handleSubmit = async () => {
    if (fileList.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin',
        text: 'Vui lòng chọn ít nhất một file hợp đồng',
        confirmButtonText: 'Đóng'
      });
      return;
    }
    if (!uploadDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin',
        text: 'Vui lòng chọn Ngày upload',
        confirmButtonText: 'Đóng'
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    let successCount = 0;
    let failCount = 0;
    const totalFiles = fileList.length;

    try {
      // Upload từng file một
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        
        // Cập nhật progress
        const progress = Math.floor((i / totalFiles) * 90);
        setUploadProgress(progress);

        try {
          const response = await contractService.uploadSignedContract(order!._id, file.originFileObj);
          
          if (response && (response.success === true || response.success === undefined)) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to upload ${file.name}:`, response?.message);
          }
        } catch (error: any) {
          failCount++;
          console.error(`Error uploading ${file.name}:`, error);
        }
      }

      // Hoàn thành progress bar
      setUploadProgress(100);

      // Hiển thị kết quả
      if (successCount === totalFiles) {
        // Gọi onSuccess để refresh data
        onSuccess();
        
        // Hiển thị SweetAlert (z-index cao, hiển thị trên modal)
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: `Đã upload thành công ${successCount} hợp đồng!`,
          confirmButtonText: 'Đóng',
          timer: 3000,
          timerProgressBar: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
          // Đảm bảo SweetAlert hiển thị trên modal
          customClass: {
            container: 'swal2-container-custom'
          },
          // Tăng z-index để hiển thị trên modal và append vào body
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '99999';
              // Đảm bảo SweetAlert được append vào body, không phải trong modal
              if (swalContainer.parentElement !== document.body) {
                document.body.appendChild(swalContainer);
              }
            }
          }
        });
        
        // Đóng modal sau khi SweetAlert đã hiển thị
        onClose();
      } else if (successCount > 0) {
        // Gọi onSuccess để refresh data
        onSuccess();
        
        // Hiển thị SweetAlert (z-index cao, hiển thị trên modal)
        await Swal.fire({
          icon: 'warning',
          title: 'Hoàn thành một phần',
          text: `Đã upload thành công ${successCount}/${totalFiles} hợp đồng. ${failCount} file thất bại.`,
          confirmButtonText: 'Đóng',
          timer: 3000,
          timerProgressBar: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
          // Đảm bảo SweetAlert hiển thị trên modal
          customClass: {
            container: 'swal2-container-custom'
          },
          // Tăng z-index để hiển thị trên modal và append vào body
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '99999';
              // Đảm bảo SweetAlert được append vào body, không phải trong modal
              if (swalContainer.parentElement !== document.body) {
                document.body.appendChild(swalContainer);
              }
            }
          }
        });
        
        // Đóng modal sau khi SweetAlert đã hiển thị
        onClose();
      } else {
        throw new Error('Tất cả các file upload đều thất bại');
      }
    } catch (error: any) {
      setUploadProgress(0);
      console.error('Error uploading contracts:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error?.response?.data?.message || error?.message || 'Lỗi khi upload hợp đồng',
        confirmButtonText: 'Đóng'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  // --- JSX Structure (MUI) ---
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={visible}
        onClose={onClose}
        // ✅ Tinh chỉnh để gọn gàng hơn, dùng kích thước nhỏ
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 1, 
            pb: 1,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <FileImageIcon color="primary" />
            <Typography variant="h6" component="span" fontWeight="bold">
              Upload hợp đồng có chữ ký
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
              <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, backgroundColor: '#f9f9f9' }}>
          <Stack spacing={3}>
            
            {/* 1. Order Information (Sử dụng Stack để gọn gàng) */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Thông tin đơn hàng
              </Typography>
              <Divider sx={{ mb: 1 }} />
              
              <Stack spacing={1}> 
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Mã đơn hàng:</Typography>
                  <Typography variant="body2" fontWeight="medium" color="primary.main">
                    {order.code}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Khách hàng:</Typography>
                  <Typography variant="body2">{order.customer?.full_name || 'N/A'}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Tổng tiền:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(order.final_amount)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* 2. Upload Form */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Thông tin & File
              </Typography>
              <Alert
                severity="info"
                sx={{ mb: 2 }}
                icon={<UploadIcon />}
              >
                Bạn có thể upload nhiều file hợp đồng đã có chữ ký của khách hàng. Hỗ trợ định dạng JPG, PNG, PDF. Kích thước tối đa 10MB mỗi file.
              </Alert>
              
              <Stack spacing={2}>
                {/* Ngày Upload */}
                <FormControl fullWidth>
                    <FormLabel sx={{ mb: 0.5 }}>Ngày upload</FormLabel>
                    <DatePicker
                        value={uploadDate}
                        onChange={(newValue) => setUploadDate(newValue)}
                        format="DD/MM/YYYY"
                        // Tối ưu hóa renderInput
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                size: 'small',
                                error: !uploadDate, 
                                helperText: !uploadDate ? "Vui lòng chọn ngày upload" : "",
                            }
                        }}
                    />
                </FormControl>

                {/* Ghi chú */}
                <TextField
                  label="Ghi chú"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline
                  rows={2} // Giảm xuống 2 dòng để gọn hơn
                  placeholder="Nhập ghi chú cho hợp đồng..."
                  fullWidth
                  size="small"
                />

                {/* Vùng Upload */}
                <Box 
                    sx={{ 
                        mt: 2, 
                        border: '2px dashed', 
                        borderColor: fileList.length === 0 ? 'grey.400' : 'success.main',
                        bgcolor: 'background.default',
                        p: fileList.length === 0 ? 4 : 2, 
                        borderRadius: 1, 
                        textAlign: 'center', 
                        cursor: 'pointer' 
                    }}
                    onClick={openFileBrowser}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        multiple // Cho phép chọn nhiều file
                    />
                    
                    {fileList.length === 0 ? (
                      <>
                        <UploadIcon color="action" sx={{ fontSize: 40 }} />
                        <Typography variant="body1" color="textSecondary">Kéo thả hoặc nhấn để chọn file hợp đồng (có thể chọn nhiều file)</Typography>
                      </>
                    ) : (
                      // Hiển thị danh sách file đã chọn
                      <Stack spacing={1} sx={{ width: '100%' }}>
                        {fileList.map((file) => (
                          <Stack key={file.uid} direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                              <FileImageIcon color="success" />
                              <Typography variant="body2" fontWeight="medium" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.name}
                              </Typography>
                              <Chip label={`${(file.size / 1024 / 1024).toFixed(2)} MB`} color="success" size="small" />
                            </Stack>
                            <Stack direction="row" spacing={0}>
                              <Tooltip title="Xem trước">
                                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handlePreview(file); }}>
                                      <EyeIcon fontSize="small" color="primary" />
                                  </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa file">
                                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleRemove(file.uid); }}>
                                      <DeleteIcon fontSize="small" />
                                  </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        ))}
                        <Box sx={{ mt: 1, textAlign: 'center' }}>
                          <Button size="small" variant="outlined" onClick={openFileBrowser} startIcon={<UploadIcon />}>
                            Thêm file khác
                          </Button>
                        </Box>
                      </Stack>
                    )}
                </Box>
                
                {/* Progress Bar */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <Typography variant="caption" color="textSecondary">Đang tải lên... ({uploadProgress}%)</Typography>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                  </Box>
                )}
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>

        {/* Dialog Actions (Footer) */}
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ width: '100%' }}>
            <Button key="cancel" variant="outlined" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button
              key="submit"
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              disabled={fileList.length === 0 || !uploadDate || loading}
              onClick={handleSubmit}
            >
              Upload hợp đồng
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ContractUpload;