import React from "react";
import { Sidebar } from "./common/Sidebar";
import { PromotionManagementDealer } from "./pages/Dealerstaff/PromotionManagement";

export const PromotionsDashboard: React.FC = () => {
  const [activeSection] = React.useState("promotions");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleSidebarOpen = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          // Navigate to the appropriate route when section changes
          window.location.href = `/portal/${section}`;
        }}
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        onOpen={handleSidebarOpen}
      />

      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "lg:ml-[280px]" : "lg:ml-16"
        }`}
      >
        <PromotionManagementDealer />
      </div>
    </div>
  );
};
