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
        title: "Authors",
        links: [
            {
                label: "All Authors",
                icon: Users,
                path: "authors", // Bỏ dấu /
            },
        ],
    },
    {
        title: "Categories",
        links: [
            {
                label: "Categories",
                icon: MessageSquare,
                path: "categories", // Bỏ dấu /
            },
        ],
    },
    {
        title: "Novels",
        links: [
            {
                label: "Novels",
                icon: Package,
                path: "novels", // Sửa thành chữ thường và bỏ dấu /
            },
        ],
    },
];