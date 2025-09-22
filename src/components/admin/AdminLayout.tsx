import React, { useState } from 'react';
import { Footer } from '../common/Footer';
import { Sidebar } from '../common/Sidebar';
import { Menu } from 'lucide-react';

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
      {/* Custom Header without using the Header component */}
      <div className="fixed top-0 z-40 bg-white border-b border-gray-200 right-0 lg:left-16 transition-all duration-300">
        <div className="h-[73px] px-6 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
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