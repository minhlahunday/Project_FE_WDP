import React, { useState } from 'react';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';
import { Footer } from '../../common/Footer';

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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        activeSection={currentSection}
        onSectionChange={handleSectionChange}
        isOpen={isSidebarOpen}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}> 
        {/* Header */}
        <div className={`fixed top-0 right-0 left-0 z-30 ${isSidebarOpen ? 'lg:left-64' : 'lg:left-16'}`}>
          <Header 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen}
          />
        </div>
        {/* Page Content */}
        <main className="flex-1 mt-[73px] pb-4 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};