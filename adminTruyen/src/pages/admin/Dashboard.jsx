import { FooterAdmin } from "@/components/Admin/FooterAdmin";
import { useTheme } from "@/context/ThemeContext";
import { Package, PencilLine, Star, Trash, TrendingUp } from "lucide-react";
import React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis ,LineChart} from "recharts";
import AuthorManager from "./authorManager"
import NovelManager from "./NovelManagement";
import CategorisManagement from "./CategoryManagement";
import AnalyticsReport from "../AnalyticsReport";
const Dashboard = () => {
    const { theme } = useTheme();

    return (
        <div className="flex flex-col gap-y-4">
            {/* Title */}
            <h1 className="title">Dashboard</h1>

            {/* Khu vực hiển thị grid */}
           
            <AnalyticsReport />
            
            <FooterAdmin/>
        </div>
    );
};

export default Dashboard;
