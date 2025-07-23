// src/constants/index.js (hoặc file tương tự)

import { Home, Users, MessageSquare, Package } from "lucide-react"; // Ví dụ

export const navbarLinks = [
    {
        title: "General",
        links: [
            {
                label: "Dashboard",
                icon: Home,
                path: "", // Để trống cho trang index của /admin
            },
        ],
    },
    {
        title: "Tác giả",
        links: [
            {
                label: "Tất cả tác giả",
                icon: Users,
                path: "authors", // Bỏ dấu /
            },
        ],
    },
    {
        title: "thể loại",
        links: [
            {
                label: "Thể loại",
                icon: MessageSquare,
                path: "categories", // Bỏ dấu /
            },
        ],
    },
    {
        title: "Tiểu thuyết",
        links: [
            {
                label: "Tiểu thuyết",
                icon: Package,
                path: "novels", // Sửa thành chữ thường và bỏ dấu /
            },
        ],
    },
     {
        title: "Người dùng",
        links: [
            {
                label: "Người dùng",
                icon: Package,
                path: "user", // Sửa thành chữ thường và bỏ dấu /
            },
        ],
    },
];