import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Redux actions
import { getAllAuthors } from "@/redux/authorSlice";
import { getAllNovels } from "@/redux/novelSlice";
import { getAllCategories } from "@/redux/categorySlice";

// Layout & Pages
import AdminLayouts from "@/pages/layouts/AdminLayouts";
import LoginAdmin from "@/pages/admin/LoginAdmin";
import AuthorManager from "@/pages/admin/authorManager";
import TransactionManager from "@/pages/TransactionManager";
import PageNotFound from "@/pages/PageNotFound";
import {
  Dashboard,
  CategoryManagement,
  NovelManagement,
  UserManager,
  RolePermissionManager
} from "../pages";
import CommentManagement from "@/pages/admin/CommentManagement";
import ReportManagement from "@/pages/admin/ReportManagement";

const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f4f6f8', paper: '#ffffff' }
  },
});

// --- COMPONENT BẢO VỆ ROUTE (PHIÊN BẢN MỚI, GỌN HƠN) ---
const ProtectedAdminRoute = ({ children }) => {
  // Chỉ cần lấy 2 trạng thái này từ Redux
  const { currentUser, isRefreshing } = useSelector((state) => state.user) || {};

  // Nếu đang trong quá trình xác thực token với server, hiển thị màn hình chờ.
  // Đây là điểm mấu chốt để ngăn việc bị đá về trang login khi F5.
  if (isRefreshing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem' }}>
        Đang tải phiên đăng nhập...
      </div>
    );
  }

  // Sau khi đã xác thực xong, nếu không có currentUser, chuyển hướng về trang login.
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Nếu mọi thứ ổn, render các component con đã được truyền vào.
  return children; 
};

// --- COMPONENT TẢI DỮ LIỆU (Giữ nguyên) ---
const PreloadDataWrapper = ({ children }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    // Chỉ tải dữ liệu này KHI người dùng đã được xác thực và vào trang admin
    dispatch(getAllNovels());
    dispatch(getAllCategories());
    dispatch(getAllAuthors());
  }, [dispatch]);
  return children;
};

// --- CẤU HÌNH ROUTER (Giữ nguyên cấu trúc) ---
const router = createBrowserRouter([
  { path: "/", element: <LoginAdmin /> },
  {
    path: "/admin",
    element: (
      <ProtectedAdminRoute>
        <ThemeProvider theme={adminTheme}>
          <CssBaseline />
          <PreloadDataWrapper>
            <AdminLayouts /> 
          </PreloadDataWrapper>
        </ThemeProvider>
      </ProtectedAdminRoute>
    ),
     children: [
      { 
        index: true, // Khớp với path: "" của Dashboard
        element: <Dashboard /> 
      },
      { 
        path: "authors", // Khớp với path: "authors"
        element: <AuthorManager /> // Component quản lý tác giả
      },
      { 
        path: "categories", // Khớp với path: "categories"
        element: <CategoryManagement /> 
      },
      { 
        path: "novels", // Khớp với path: "novels"
        element: <NovelManagement /> 
      },
       { 
        path: "user", // Khớp với path: "user"
        element: <UserManager /> 
      },
      { 
        path: "transactions", // Khớp với path: "transactions" trong navbarLinks
        element: <TransactionManager /> 
      },
      { 
        path: "comments", // Khớp với path: "comments" trong navbarLinks
        element: < CommentManagement/>
      },
      { 
        path: "role-permission", // Khớp với path: "role-permission" 
        element: <RolePermissionManager />
      },
      { 
        path: "reports", // Khớp với path: "reports" - Quản lý báo cáo
        element: <ReportManagement />
      },
      // Thêm các route khác của bạn ở đây nếu có
    ],
  },
  { 
    path: "*", 
    element: <PageNotFound /> 
  },
]);

export default function RouterSetup() {
  return <RouterProvider router={router} />;
}