import "./globals.css";
import type { Metadata } from "next";
import BottomNavigation from "./components/BottomNavigation";

export const metadata: Metadata = {
  title: "탑골톡",
  description: "탑골톡 커뮤니티",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
        {children}
        <BottomNavigation />
      </body>
    </html>
  );
}
