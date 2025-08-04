import React, { forwardRef } from "react";
import { ChevronDown, ChevronUp, Projector, Search, Settings, User2 } from "lucide-react";
import { FakeAdminData } from "@/assets/FakeAdminData";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { navbarLinks } from "@/constants";

const AppSidebar = forwardRef(({ collapsed }, ref) => {
    return (
        <aside
            ref={ref}
            className={cn(
                `fixed z-[100] flex h-full w-[240px] flex-col overflow-x-hidden border-r border-r-slate-200 bg-white/80 backdrop-blur-xl shadow-lg transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/80`,
                collapsed ? "md:w-[70px] md:items-center" : "md:w-[240px]",
                collapsed ? "max-md:-left-full" : "max-md:left-0",
            )}
        >
            <div className="flex items-center gap-x-3 p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                    <img
                        src={"/image.png"}
                        className="h-6 w-6"
                        alt={"Main-Logo"}
                    />
                </div>
                {!collapsed && (
                    <div className="flex flex-col">
                        <p className="text-lg font-bold text-slate-900 transition-colors dark:text-slate-100">
                            Web Truyện
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Admin Panel
                        </p>
                    </div>
                )}
            </div>

            <div className="flex w-full flex-col gap-y-4 overflow-x-hidden overflow-y-auto p-4 custom-scrollbar">
                {navbarLinks.map((nav, index) => (
                    <nav
                        key={index}
                        className={cn(`sidebar-group`, collapsed && "md:items-center")}
                    >
                        <p className={cn(`sidebar-group-title`, collapsed && "md:w-[45px] md:text-center")}>{nav.title}</p>

                        {nav.links.map((link, index_2) => (
                            <NavLink
                                key={index_2}
                                to={link.path}
                                end // Chỉ kích hoạt `active` nếu URL khớp chính xác
                                className={cn("sidebar-item", collapsed && "md:w-[45px] md:justify-center")}
                            >
                                <link.icon
                                    size={20}
                                    className="shrink-0"
                                />

                                {!collapsed && <p className="whitespace-nowrap"> {link.label} </p>}
                            </NavLink>
                        ))}
                    </nav>
                ))}
            </div>
        </aside>
    );
});

AppSidebar.displayName = "Sidebar"; // Để hiển thị tên trong debug React DevTools

export default AppSidebar;
