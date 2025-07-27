import ButtonHov from '@/components/tailwind-custom/ButtonHov'
import { useTheme } from '@/context/ThemeContext'
import React from 'react'

const PageNotFound = () => {
  const { theme } = useTheme();
  
  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300'>
      <div className='w-full max-w-md text-center p-8'>
        <div className='admin-card'>
          <div className='admin-card-body space-y-6'>
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
              <img 
                src="../src/assets/sub-icon/EmptyBox.png" 
                alt="Page Not Found" 
                className="w-12 h-12 opacity-70"
              />
            </div>
            <div className="space-y-2">
              <h1 className='text-3xl font-bold gradient-text'>404</h1>
              <h2 className='text-xl font-semibold text-slate-800 dark:text-slate-200'>Trang không tìm thấy</h2>
              <p className='text-slate-600 dark:text-slate-400'>Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
            </div>
            <div className="pt-4">
              <a 
                href="/admin" 
                className="admin-btn admin-btn-primary inline-flex items-center gap-2"
              >
                Quay về Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PageNotFound