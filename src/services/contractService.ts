import { get, post, del } from './httpClient';

// Interfaces for Contract APIs
export interface ContractInfo {
  _id?: string;
  contract_url?: string;
  contract_signed?: boolean;
  signed_date?: string;
  upload_date?: string;
  notes?: string;
  signed_by?: string;
  uploaded_by?: string;
  template_used?: string;
  signed_contract_urls?: Array<{
    url: string;
    uploaded_at?: string;
    type?: string;
  }>;
}

export interface ContractTemplate {
  name: string;
  description?: string;
  html_content: string;
}

export interface ContractResponse {
  success: boolean;
  message: string;
  data: ContractInfo;
}

export interface ContractTemplatesResponse {
  success: boolean;
  message: string;
  data: ContractTemplate[];
}

// Contract service functions
export const contractService = {
  // Get contract information for an order
  async getContractInfo(orderId: string): Promise<ContractResponse> {
    const response = await get(`/api/contracts/orders/${orderId}`);
    return response.data;
  },

  // Generate contract PDF for an order
  async generateContract(orderId: string, templateData?: any): Promise<Blob> {
    const response = await post(`/api/contracts/orders/${orderId}/generate`, templateData, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Upload signed contract
  async uploadSignedContract(orderId: string, file: File): Promise<ContractResponse> {
    const formData = new FormData();
    formData.append('contract', file);
    
    const response = await post(`/api/contracts/orders/${orderId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get available contract templates
  async getTemplates(): Promise<ContractTemplatesResponse> {
    const response = await get('/api/contracts/templates');
    return response.data;
  },

  // Save custom contract template
  async saveTemplate(template: ContractTemplate): Promise<ContractResponse> {
    const response = await post('/api/contracts/templates', template);
    return response.data;
  },

  // Delete signed contract
  async deleteSignedContract(orderId: string, signedContractUrl: string): Promise<ContractResponse> {
    // Backend API yêu cầu signed_contract_url trong request body (theo API documentation)
    console.log('🗑️ deleteSignedContract called:', { orderId, signedContractUrl });
    const requestData = { signed_contract_url: signedContractUrl };
    console.log('📤 Sending DELETE request with body:', requestData);
    // del() đã trả về response.data rồi, không cần gọi .data nữa
    const response = await del(`/api/contracts/orders/${orderId}`, {
      data: requestData
    });
    console.log('📥 DELETE response:', response);
    // Response đã là data rồi (từ httpClient.request), không cần .data
    return response as ContractResponse;
  }
};

export default contractService;