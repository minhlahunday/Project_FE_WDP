import React from "react";
import { AdminLayout } from "./AdminLayout";
import {
  StaffTable,
  StaffStats,
  SearchAndActions,
  AddStaffModal,
  PageHeader,
} from "./components";
import { useStaffManagement } from "../../../hooks/useStaffManagement";

export const AdminStaffManagement: React.FC = () => {
  const {
    staffList,
    filteredStaff,
    searchTerm,
    showAddModal,
    newStaff,
    loading,
    loadingStaff,
    loadingRoles,
    error,
    success,
    setSearchTerm,
    setShowAddModal,
    handleAddStaff,
    handleInputChange,
    handleSaveNewStaff,
    handleDeleteStaff,
    handleToggleStatus,
    getAvailableRoles,
    fetchStaff,
  } = useStaffManagement();

  return (
    <AdminLayout activeSection="admin-staff-management">
      <div className="p-6">
        {/* Header */}
        <PageHeader />

        {/* Search and Actions */}
        <SearchAndActions
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddStaff={handleAddStaff}
        />

        {/* Stats Cards */}
        <StaffStats staffList={staffList} />

        {/* Staff Table */}
        {loadingStaff ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500">Đang tải danh sách nhân viên...</p>
            </div>
          </div>
        ) : (
          <StaffTable
            filteredStaff={filteredStaff}
            onToggleStatus={handleToggleStatus}
            onDeleteStaff={handleDeleteStaff}
          />
        )}
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        showModal={showAddModal}
        onClose={() => setShowAddModal(false)}
        newStaff={newStaff}
        loading={loading}
        loadingRoles={loadingRoles}
        error={error}
        success={success}
        onInputChange={handleInputChange}
        onSubmit={handleSaveNewStaff}
        availableRoles={getAvailableRoles()}
      />
    </AdminLayout>
  );
};
