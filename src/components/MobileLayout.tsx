"use client";
import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { key: "orders", label: "Bán hàng", icon: "🛒" },
  { key: "report", label: "Báo cáo", icon: "📊" },
  { key: "products", label: "Sản phẩm", icon: "📦" },
];

interface Props {
  children: ReactNode;
}

export default function MobileLayout({ children }: Props) {
  const pathname = usePathname() || "/";
  const activeMenu = pathname.startsWith("/products") ? "products" : pathname.startsWith("/report") ? "report" : "orders";

  return (
    <div className="min-h-screen bg-linear-to-br from-yellow-50 to-orange-100 flex flex-col">
  <header className="bg-orange-500 text-white py-4 px-6 flex items-center justify-between shadow-md no-print">
        <div className="font-bold text-lg">Kho Alibaba</div>
        <div className="text-sm">Ứng dụng tính tiền kho</div>
      </header>

      {/* Desktop/Tablet vertical nav */}
  <nav className="hidden sm:fixed sm:left-0 sm:top-0 sm:h-full sm:w-20 sm:bg-white sm:shadow-lg sm:flex sm:flex-col sm:items-center sm:pt-24 sm:gap-8 sm:z-10 sm:border-r sm:border-orange-200 no-print">
        {menuItems.map((item) => {
          const href = item.key === "orders" ? "/" : item.key === "products" ? "/products" : "/report";
          return (
            <Link key={item.key} href={href} className={`flex flex-col items-center text-xs font-medium ${activeMenu === item.key ? 'text-orange-600' : 'text-gray-400'}`}>
              <span className="text-2xl mb-1">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom navigation - modern pill */}
  <nav className="sm:hidden fixed left-1/2 -translate-x-1/2 bottom-4 z-30 w-[min(96%,480px)] bg-white rounded-full shadow-lg px-3 py-2 flex items-center justify-between gap-2 no-print">
        {menuItems.map((item) => {
          const href = item.key === "orders" ? "/" : item.key === "products" ? "/products" : "/report";
          const active = activeMenu === item.key;
          return (
            <Link key={item.key} href={href} className={`flex-1 flex flex-col items-center justify-center text-xs ${active ? 'text-orange-600' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${active ? 'bg-orange-100' : 'bg-transparent'}`}> 
                <span className="text-xl">{item.icon}</span>
              </div>
              <span className="mt-1 text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 px-3 py-4 sm:ml-20 pb-28 sm:pb-4">
        {children}
      </main>
    </div>
  );
}
