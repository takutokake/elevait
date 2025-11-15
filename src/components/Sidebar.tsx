"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

interface SidebarProps {
  variant?: "dashboard" | "admin";
  items: SidebarItem[];
  bottomItems?: SidebarItem[];
}

export default function Sidebar({ variant = "dashboard", items, bottomItems }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col justify-between border-r border-[#E2E8F0] bg-[#FFFFFF] p-6 dark:border-[#1e293b] dark:bg-[#0f172a] md:flex">
      <div className="flex flex-col gap-8">
        <Logo size="md" />
        
        <nav className="flex flex-col gap-2">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sky-100 text-[#0ea5e9] dark:bg-sky-500/20"
                    : "text-[#64748B] hover:bg-slate-100 dark:text-[#94A3B8] dark:hover:bg-slate-800 hover:text-[#1E293B] dark:hover:text-[#E2E8F0]"
                }`}
                href={item.href}
              >
                <div className="w-5 h-5 flex-shrink-0">
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {bottomItems && (
        <div className="flex flex-col gap-2">
          {bottomItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sky-100 text-[#0ea5e9] dark:bg-sky-500/20"
                    : "text-[#64748B] hover:bg-slate-100 dark:text-[#94A3B8] dark:hover:bg-slate-800 hover:text-[#1E293B] dark:hover:text-[#E2E8F0]"
                }`}
                href={item.href}
              >
                <div className="w-5 h-5 flex-shrink-0">
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
