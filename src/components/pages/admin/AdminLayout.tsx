import React, { useState } from 'react';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  activeSection = 'analytics' 
}) => {
  const [currentSection, setCurrentSection] = useState(activeSection);
  // Sidebar always open on desktop, toggle only on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      < Sidebar
        activeSection={currentSection}
        onSectionChange={handleSectionChange}
        isOpen={isSidebarOpen}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col transition-all duration-300 lg:ml-64"> 
        {/* Header */}
        <div className="fixed top-0 right-0 left-0 z-30 lg:left-64">
          <Header 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen}
          />
        </div>
        {/* Page Content */}
        <main className="flex-1 pt-16 pb-4 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};