import React from "react";
import { Sidebar } from "./common/Sidebar";
import { Header } from "./common/Header";
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
    <div className="min-h-screen flex">
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

      <div className="flex-1 flex flex-col transition-all duration-300 lg:ml-[220px]">
        {/* Header */}
        <div className="fixed top-0 right-0 left-0 z-30 lg:left-[220px]">
          <Header 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen}
          />
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pt-14 pl-0 pr-0">
          <PromotionManagementDealer />
        </main>
      </div>
    </div>
  );
};
