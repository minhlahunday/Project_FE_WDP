import React, { useState } from 'react';
import { Card, Button, message, Typography, Space, Input } from 'antd';
import { FilePdfOutlined, KeyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const TestAPI: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('68f102485407320b89807842');

  const checkToken = () => {
        const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    console.log('=== TOKEN DEBUG ===');
    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length || 0);
    console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
    console.log('User exists:', !!user);
    console.log('User data:', user ? JSON.parse(user) : 'No user');
    console.log('==================');
    
    message.info(`Token: ${!!token ? 'EXISTS' : 'MISSING'}, User: ${!!user ? 'EXISTS' : 'MISSING'}`);
  };

  const testContractAPI = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem('accessToken');
      
      if (!token) {
        message.error('No token found! Please login first.');
        return;
      }

      message.info('Testing contract API...');
      
      const response = await fetch(`http://localhost:5000/api/contracts/orders/${orderId}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_name: 'default',
          template_data: {
            location: 'Thành phố Hồ Chí Minh',
            dealership: {
              name: 'VinFast Dealership',
              address: '123 Đường ABC, Quận 1, TP.HCM',
              phone: '1900 1234',
              tax_code: '0123456789'
            },
            downPayment: 0
          }
        }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `test-contract-${orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        message.success('Contract generated successfully!');
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        message.error(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      message.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>API Test Tool</Title>
        <Text type="secondary">
          Tool để test API và debug token
        </Text>
        
        <div style={{ marginTop: '20px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="Token Debug" size="small">
              <Button
                icon={<KeyOutlined />}
                onClick={checkToken}
                block
              >
                Check Token & User Data
              </Button>
            </Card>

            <Card title="Contract API Test" size="small">
              <div style={{ marginBottom: '10px' }}>
                <Text strong>Order ID:</Text>
                <Input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter Order ID"
                  style={{ marginTop: '5px' }}
                />
              </div>
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                loading={loading}
                onClick={testContractAPI}
                block
              >
                {loading ? 'Testing API...' : 'Test Contract API'}
              </Button>
            </Card>

            <Card title="Instructions" size="small">
              <ol style={{ fontSize: '12px', color: '#666' }}>
                <li>Click "Check Token & User Data" to see authentication status</li>
                <li>If no token, go to login page and login again</li>
                <li>Enter a valid Order ID</li>
                <li>Click "Test Contract API" to test the endpoint</li>
                <li>Check console for detailed logs</li>
              </ol>
            </Card>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default TestAPI;
