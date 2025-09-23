import React, { useState } from 'react';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  activeSection = 'analytics' 
}) => {
  const [currentSection, setCurrentSection] = useState(activeSection);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeSection={currentSection}
        onSectionChange={handleSectionChange}
        isOpen={isSidebarOpen}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        {/* Header */}
        <div className="fixed top-0 right-0 left-0 z-30 lg:left-16">
          <div className={`transition-all duration-300 ${
            isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
          }`}>
            <Header 
              onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              isSidebarOpen={isSidebarOpen}
            />
          </div>
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto mt-[73px]">
          {children}
        </main>
      </div>
    </div>
  );
};