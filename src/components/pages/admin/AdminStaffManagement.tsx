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
        <StaffTable
          filteredStaff={filteredStaff}
          onToggleStatus={handleToggleStatus}
          onDeleteStaff={handleDeleteStaff}
        />
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        showModal={showAddModal}
        onClose={() => setShowAddModal(false)}
        newStaff={newStaff}
        loading={loading}
        error={error}
        success={success}
        onInputChange={handleInputChange}
        onSubmit={handleSaveNewStaff}
        availableRoles={getAvailableRoles()}
      />
    </AdminLayout>
  );
};
