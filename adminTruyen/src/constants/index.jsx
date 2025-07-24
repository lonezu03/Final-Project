// src/constants/index.js (hoặc file tương tự)

import { Home, Users, MessageSquare, Package } from "lucide-react"; // Ví dụ

export const navbarLinks = [
    {
        title: "General",
        links: [
            {
                label: "Dashboard",
                icon: Home,
                path: "",
            },
        ],
    },
    {
        title: "Tác giả",
        links: [
            {
                label: "Tất cả tác giả",
                icon: Users,
                path: "authors",
            },
        ],
    },
    {
        title: "thể loại",
        links: [
            {
                label: "Thể loại",
                icon: MessageSquare,
                path: "categories",
            },
        ],
    },
    {
        title: "Tiểu thuyết",
        links: [
            {
                label: "Tiểu thuyết",
                icon: Package,
                path: "novels",
            },
        ],
    },
    {
        title: "Giao dịch",
        links: [
            {
                label: "Giao dịch",
                icon: Package,
                path: "transactions",
            },
        ],
    },
    {
        title: "Người dùng",
        links: [
            {
                label: "Người dùng",
                icon: Package,
                path: "user",
            },
        ],
    },
];