import React, { useState } from 'react';
import { Footer } from '../common/Footer';
import { Sidebar } from '../common/Sidebar';
import { Header } from '../common/Header';

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Use the Header component */}
      <Header 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        isSidebarOpen={isSidebarOpen}
      />
      
      <div className="flex-grow flex pt-[73px]">
        <Sidebar 
          activeSection={currentSection}
          onSectionChange={handleSectionChange}
          isOpen={isSidebarOpen}
          onOpen={() => setIsSidebarOpen(true)}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <main className="flex-grow lg:ml-16 transition-all duration-300 ease-in-out">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};