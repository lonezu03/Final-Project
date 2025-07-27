import AppSidebar from '@/components/Admin/AppSidebar'
import NavbarAdmin from '@/components/Admin/NavbarAdmin'
import { ThemeProvider } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@uidotdev/usehooks'
import { Dessert } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useClickOutside } from '@/hooks/use-click-outside'


const AdminLayouts = ({ children }) => {
  // Kiểm tra breakpoint là màn hình desktop
  const isDesktopDevice = useMediaQuery("(min-width: 768px)");
  // Công tắc đóng mở sidebar
  const [collapsed, setCollapsed] = useState(!isDesktopDevice); 
  const sidebarRef = useRef(null);

  // Xử lý màn hình thiết bị desktop
  useEffect(() => {
    setCollapsed(!isDesktopDevice)
  }, [isDesktopDevice]);

  useClickOutside([sidebarRef], () => {
    if (!isDesktopDevice && !collapsed){
      setCollapsed(true);
    }
  });

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        {/* Background Pattern */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.05),rgba(0,0,0,0))]"></div>
        </div>

        {/* Overlay */}
        <div className={cn(`pointer-events-none fixed inset-0 -z-10 bg-black/50 backdrop-blur-sm opacity-0 transition-opacity`,
          !collapsed && "max-md:pointer-events-auto max-md:z-50 max-md:opacity-30",
        )} />

        {/* 1. Thanh Sidebar */}
        <AppSidebar ref={sidebarRef} collapsed={collapsed} />

        {/* 2. Phần Navbar và Content */}
        <div className={cn(`transition-[margin] duration-300`,
          collapsed ? "md:ml-[70px]" : "md:ml-[240px]")
        }>
          {/* 2.1: Header Navbar */}
          <NavbarAdmin collapsed={collapsed} setCollapsed={setCollapsed} />


          {/* 2.2: Phần nội dung */}
          <div className="h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default AdminLayouts