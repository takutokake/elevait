import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elevait - Personalized PM Coaching",
  description: "Connect with elite product management coaches and accelerate your career. Personalized coaching for students and new grads pursuing PM roles.",
  icons: {
    icon: "/images/Elevait_logo.png",
    apple: "/images/Elevait_logo.png",
  },
  openGraph: {
    title: "Elevait - Personalized PM Coaching",
    description: "Connect with elite product management coaches and accelerate your career.",
    images: ["/images/Elevait_logo.png"],
    siteName: "Elevait",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
