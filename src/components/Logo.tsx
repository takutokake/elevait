import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  href?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-auto",
  md: "h-10 w-auto",
  lg: "h-20 w-auto",
  xl: "h-28 w-auto"
};

export default function Logo({ 
  size = "md", 
  showText = false, 
  href = "/",
  className = "" 
}: LogoProps) {
  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/images/Elevait_logo.png"
        alt="Elevait Logo"
        width={56}
        height={56}
        className={sizeClasses[size]}
        priority
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
