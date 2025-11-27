import Header from "./Header-simple";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  variant?: "landing" | "dashboard" | "admin";
  sidebarItems?: any[];
  sidebarBottomItems?: any[];
  user?: {
    name: string;
    avatar?: string;
    initials?: string;
  };
}

export default function Layout({ 
  children, 
  variant = "landing", 
  sidebarItems = [], 
  sidebarBottomItems = [],
  user 
}: LayoutProps) {
  if (variant === "landing") {
    return (
      <div className="font-display bg-[#F7F9FB] dark:bg-[#111827] text-[#0F172A] dark:text-[#F3F4F6] min-h-screen flex flex-col">
        <Header variant="landing" />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  if (variant === "dashboard" || variant === "admin") {
    return (
      <div className="font-display bg-[#F8FAFC] dark:bg-[#020617] min-h-screen">
        <div className="flex min-h-screen w-full">
          <Sidebar 
            variant={variant} 
            items={sidebarItems} 
            bottomItems={sidebarBottomItems} 
          />
          
          <div className="flex flex-1 flex-col">
            <Header variant={variant} user={user} />
            
            <main className="flex-1 overflow-auto p-6">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return <div>{children}</div>;
}
