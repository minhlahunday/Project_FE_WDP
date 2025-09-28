import React, { useState } from "react";
import { AdminLayout } from "../admin/AdminLayout";

// Dummy data for products
const initialProducts = [
  {
    id: 1,
    name: "VF8",
    category: "SUV",
    price: 1000000,
    discountPrice: 950000,
    quantity: 10,
    status: "Đang kinh doanh",
    dealer: "Đại lý A",
  },
];

const categories = ["SUV", "Sedan", "Hatchback", "Truck"];
const dealers = ["Đại lý A", "Đại lý B", "Đại lý C"];

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState({
    id: 0,
    name: "",
    category: "SUV",
    price: 0,
    discountPrice: 0,
    quantity: 0,
    status: "Đang kinh doanh",
    dealer: dealers[0],
  });
  const [isEdit, setIsEdit] = useState(false);

  // CRUD Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddProduct = () => {
    setProducts([...products, { ...form, id: Date.now() }]);
    setForm({ id: 0, name: "", category: "SUV", price: 0, discountPrice: 0, quantity: 0, status: "Đang kinh doanh", dealer: dealers[0] });
  };

  const handleEditProduct = (product: any) => {
    setForm(product);
    setIsEdit(true);
  };

  const handleUpdateProduct = () => {
    if (form.id) {
      setProducts(products.map(p => (p.id === form.id ? form : p)));
    }
    setForm({ id: 0, name: "", category: "SUV", price: 0, discountPrice: 0, quantity: 0, status: "Đang kinh doanh", dealer: dealers[0] });
    setIsEdit(false);
  };

  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Inventory & Price Management
  const handleStatusChange = (id: number, status: string) => {
    setProducts(products.map(p => (p.id === id ? { ...p, status } : p)));
  };

  const handleQuantityChange = (id: number, quantity: number) => {
    setProducts(products.map(p => (p.id === id ? { ...p, quantity } : p)));
  };

  const handleDealerChange = (id: number, dealer: string) => {
    setProducts(products.map(p => (p.id === id ? { ...p, dealer } : p)));
  };

  return (
    <AdminLayout activeSection="product-management">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Quản lý sản phẩm</h2>
        {/* Product Form */}
        <div className="mb-6 border p-4 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">{isEdit ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <input name="name" value={form.name} onChange={handleInputChange} placeholder="Tên sản phẩm" className="border p-2 rounded" />
            <select name="category" value={form.category} onChange={handleInputChange} className="border p-2 rounded">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input name="price" type="number" value={form.price} onChange={handleInputChange} placeholder="Giá lẻ" className="border p-2 rounded" />
            <input name="discountPrice" type="number" value={form.discountPrice} onChange={handleInputChange} placeholder="Giá chiết khấu" className="border p-2 rounded" />
            <input name="quantity" type="number" value={form.quantity} onChange={handleInputChange} placeholder="Số lượng" className="border p-2 rounded" />
            <select name="status" value={form.status} onChange={handleInputChange} className="border p-2 rounded">
              <option value="Đang kinh doanh">Đang kinh doanh</option>
              <option value="Ngừng kinh doanh">Ngừng kinh doanh</option>
            </select>
            <select name="dealer" value={form.dealer} onChange={handleInputChange} className="border p-2 rounded">
              {dealers.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="mt-4">
            {isEdit ? (
              <button onClick={handleUpdateProduct} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Cập nhật</button>
            ) : (
              <button onClick={handleAddProduct} className="bg-green-500 text-white px-4 py-2 rounded">Thêm mới</button>
            )}
          </div>
        </div>
        {/* Product Table */}
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Tên</th>
              <th className="border px-2 py-1">Danh mục</th>
              <th className="border px-2 py-1">Giá lẻ</th>
              <th className="border px-2 py-1">Giá chiết khấu</th>
              <th className="border px-2 py-1">Số lượng</th>
              <th className="border px-2 py-1">Trạng thái</th>
              <th className="border px-2 py-1">Đại lý</th>
              <th className="border px-2 py-1">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td className="border px-2 py-1">{product.name}</td>
                <td className="border px-2 py-1">{product.category}</td>
                <td className="border px-2 py-1">{product.price}</td>
                <td className="border px-2 py-1">{product.discountPrice}</td>
                <td className="border px-2 py-1">
                  <input type="number" value={product.quantity} min={0} onChange={e => handleQuantityChange(product.id, Number(e.target.value))} className="w-16 border p-1 rounded" />
                </td>
                <td className="border px-2 py-1">
                  <select value={product.status} onChange={e => handleStatusChange(product.id, e.target.value)} className="border p-1 rounded">
                    <option value="Đang kinh doanh">Đang kinh doanh</option>
                    <option value="Ngừng kinh doanh">Ngừng kinh doanh</option>
                  </select>
                </td>
                <td className="border px-2 py-1">
                  <select value={product.dealer} onChange={e => handleDealerChange(product.id, e.target.value)} className="border p-1 rounded">
                    {dealers.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </td>
                <td className="border px-2 py-1">
                  <button onClick={() => handleEditProduct(product)} className="bg-yellow-400 text-white px-2 py-1 rounded mr-2">Sửa</button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-500 text-white px-2 py-1 rounded">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default ProductManagement;
