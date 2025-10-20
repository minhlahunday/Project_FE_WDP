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

    const file = files[0];
    const isImageOrPdf = file.type.startsWith('image/') || file.type === 'application/pdf';
    const isLt10M = file.size / 1024 / 1024 < 10;

    if (!isImageOrPdf) {
      alert('Chỉ hỗ trợ file ảnh và PDF!'); 
      return;
    }
    if (!isLt10M) {
      alert('File phải nhỏ hơn 10MB!'); 
      return;
    }

    const newFile: CustomUploadFile = {
      uid: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      originFileObj: file,
      status: 'done',
    };
    // Chỉ cho phép 1 file
    setFileList([newFile]);
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
        alert('File PDF. Vui lòng Tải xuống để xem.');
        return;
    }
    
    // Nếu là ảnh, có thể hiện trong Dialog, ở đây dùng tạm alert
    const previewUrl = (file as any).url || (file as any).preview || await getBase64(file.originFileObj);
    alert(`Xem trước file ${file.name}. (Dùng Dialog MUI để hiện ảnh)`);
  };

  // --- Logic Submit ---
  const handleSubmit = async () => {
    if (fileList.length === 0) {
      alert('Vui lòng chọn ít nhất một file hợp đồng');
      return;
    }
    if (!uploadDate) {
      alert('Vui lòng chọn Ngày upload');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    const fileToUpload = fileList[0].originFileObj;

    // Giả lập tiến trình upload
    let progress = 0;
    const interval = setInterval(() => {
        progress = Math.min(progress + 20, 90);
        setUploadProgress(progress);
    }, 200);


    try {
      // 1. Upload contract
      const response = await contractService.uploadSignedContract(order!._id, fileToUpload);

      // 2. Hoàn thành progress bar
      clearInterval(interval);
      setUploadProgress(100);

      if (response && (response.success === true || response.success === undefined)) {
        // Có thể thêm bước cập nhật ghi chú và ngày upload nếu API hỗ trợ
        
        alert('Đã upload hợp đồng thành công!');
        onSuccess();
        onClose();
      } else {
        throw new Error(response?.message || 'Failed to upload contract');
      }
    } catch (error: any) {
      clearInterval(interval);
      setUploadProgress(0);
      console.error('Error uploading contract:', error);
      alert('Lỗi khi upload hợp đồng');
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
                Vui lòng upload file ảnh hợp đồng đã có chữ ký của khách hàng. Hỗ trợ định dạng JPG, PNG, PDF. Kích thước tối đa 10MB.
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
                        disabled={fileList.length > 0} // Chỉ cho chọn 1 file
                    />
                    
                    {fileList.length === 0 ? (
                      <>
                        <UploadIcon color="action" sx={{ fontSize: 40 }} />
                        <Typography variant="body1" color="textSecondary">Kéo thả hoặc nhấn để chọn file hợp đồng</Typography>
                      </>
                    ) : (
                      // Hiển thị file đã chọn
                      <Stack key={fileList[0].uid} direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                              <FileImageIcon color="success" />
                              <Typography variant="body2" fontWeight="medium">{fileList[0].name}</Typography>
                              <Chip label={`${(fileList[0].size / 1024 / 1024).toFixed(2)} MB`} color="success" size="small" />
                          </Stack>
                          <Stack direction="row" spacing={0}>
                              <Tooltip title="Xem trước">
                                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handlePreview(fileList[0]); }}>
                                      <EyeIcon fontSize="small" color="primary" />
                                  </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa file">
                                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleRemove(fileList[0].uid); }}>
                                      <DeleteIcon fontSize="small" />
                                  </IconButton>
                              </Tooltip>
                          </Stack>
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