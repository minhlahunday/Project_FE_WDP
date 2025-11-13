import React, { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "./common/Header";
import { Sidebar } from "./common/Sidebar";
import { VehicleCatalog } from "./sections/VehicleCatalog";
import { SalesManagement } from "./pages/Dealerstaff/SalesManagement";
import { CustomerManagement } from "./pages/Dealerstaff/CustomerManagement";
import { PromotionManagementDealer } from "./pages/Dealerstaff/PromotionManagement";

import { Play, Pause, Volume2, VolumeX } from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("vehicles");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const sidebarHoverTimeout = useRef<NodeJS.Timeout>();

  // Calculate background color based on scroll position - chỉ cho non-video sections
  const getBackgroundColor = () => {
    if (activeSection !== "vehicles") return "bg-gray-100";
    return ""; // Không set background cho video section
  };

  const togglePlayPause = () => {
    const video = document.getElementById("hero-video") as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = document.getElementById("hero-video") as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSidebarOpen = () => {
    if (sidebarHoverTimeout.current) {
      clearTimeout(sidebarHoverTimeout.current);
    }
    setIsSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    sidebarHoverTimeout.current = setTimeout(() => {
      setIsSidebarOpen(false);
    }, 300); // Thêm độ trễ để người dùng có thể di chuyển chuột vào sidebar
  };

  const renderContent = () => {
    // For EVM Staff and Admin
    if (user?.role === "evm_staff" || user?.role === "admin") {
      switch (activeSection) {
        case "vehicles":
          return <VehicleCatalog />;
      }
    }

    // For Dealer Staff and Manager
    switch (activeSection) {
      case "vehicles":
        return <VehicleCatalog />;
      case "sales":
        return <SalesManagement />;
      case "customers":
        return <CustomerManagement />;
      case "promotions":
        return <PromotionManagementDealer />;
      case "test-drives":
        return <CustomerManagement />;
      case "orders":
        return <SalesManagement />;
      case "payments":
        return <SalesManagement />;
      case "feedback":
        return <CustomerManagement />;
      default:
        return <VehicleCatalog />;
    }
  };

  return (
    <div
      className={`min-h-screen ${
        activeSection === "vehicles" ? "" : getBackgroundColor()
      }`}
    >
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          setIsSidebarOpen(false); // Tự động đóng sidebar khi chọn mục
        }}
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        onOpen={handleSidebarOpen}
      />

      <div
        className="relative transition-all duration-300 ease-in-out lg:ml-[220px]"
      >
        {/* Hero Video Section - Full screen */}
        {activeSection === "vehicles" && (
          <>
            {/* Video Container - bọc video với overflow hidden và negative margin để sát sidebar */}
            <div
              className="relative h-screen overflow-hidden transition-all duration-300 ease-in-out -ml-[220px] w-[calc(100%+220px)]"
            >
              {/* Video Background */}
              <video
                id="hero-video"
                className="absolute top-0 left-0 w-full h-full object-cover"
                autoPlay
                muted={isMuted}
                loop
                playsInline
              >
                <source src="/videos/vinfast-hero.mp4" type="video/mp4" />
                <source
                  src="https://www.vinfast.vn/wp-content/uploads/2023/03/VF8-Hero-Video.mp4"
                  type="video/mp4"
                />
              </video>

              {/* Fallback image */}
              <div
                className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10"
                style={{
                  backgroundImage: `url('https://vinfastauto.com/sites/default/files/2023-01/VF8%20Hero%20Desktop.jpg')`,
                }}
              />

              {/* Transparent Header Overlay */}
              <div className="absolute top-0 left-0 right-0 z-50">
                <div className="bg-gradient-to-b from-black/30 via-transparent to-transparent h-24 pointer-events-none" />
                <div className="absolute top-0 left-0 right-0">
                  <Header
                    onMenuClick={() => {}} // Giữ lại để không gây lỗi, nhưng không có tác dụng
                    isTransparent={true}
                    isSidebarOpen={isSidebarOpen}
                  />
                </div>
              </div>

              {/* Content Overlay */}
              <div
                className={`absolute inset-0 flex flex-col justify-end p-8 lg:p-16 z-20 ${
                  isSidebarOpen ? "ml-[220px]" : "ml-16"
                }`}
              >
                <div className="max-w-4xl">
                  <h1 className="text-5xl lg:text-7xl font-light text-white mb-4 leading-tight">
                    VinFast VF9
                  </h1>
                  <div className="flex flex-wrap gap-4 mb-8">
                    {/* <button className="bg-white text-black px-8 py-3 text-sm font-medium hover:bg-gray-100 transition-colors">
                      Khám phá sản phẩm
                    </button> */}
                  </div>
                </div>
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-8 right-8 flex gap-3 z-30">
                <button
                  onClick={togglePlayPause}
                  className="w-12 h-12 bg-black/50 border border-white/30 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <button
                  onClick={toggleMute}
                  className="w-12 h-12 bg-black/50 border border-white/30 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>

              {/* Scroll indicator - điều chỉnh để hiển thị giữa vùng video (không tính sidebar) */}
              <div
                className={`absolute bottom-8 flex flex-col items-center text-white/70 z-30 ${
                  isSidebarOpen
                    ? "left-[calc(50%+140px)] transform -translate-x-1/2"
                    : "left-[calc(50%+32px)] transform -translate-x-1/2"
                }`}
              >
                <span className="text-sm mb-2 uppercase tracking-wider">
                  Kéo xuống để khám phá
                </span>
                <div className="w-px h-16 bg-gradient-to-b from-white/70 to-transparent animate-pulse" />
              </div>
            </div>

            {/* Vehicle Catalog Section - sử dụng thành phần có sẵn */}
            <div className="relative z-20 bg-white">
              <VehicleCatalog />
            </div>
          </>
        )}

        {/* Regular Header for other sections */}
        {activeSection !== "vehicles" && (
          <Header onMenuClick={() => {}} isSidebarOpen={isSidebarOpen} /> // Giữ lại để không gây lỗi
        )}

        {/* Content for non-vehicle sections */}
        {activeSection !== "vehicles" && (
          <main className="pt-16 p-6">{renderContent()}</main>
        )}
      </div>
    </div>
  );
};
