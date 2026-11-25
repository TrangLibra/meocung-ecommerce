import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import LayoutWrapper from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "Mèo Cưng - Thức ăn chó mèo & Cẩm nang thú cưng TP.HCM",
  description: "Mèo Cưng - Chuyên bán thức ăn hạt, pate mèo, cát vệ sinh chất lượng cao. Cẩm nang chăm sóc và giống mèo chuẩn khoa học. Giao hàng hỏa tốc TP.HCM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased flex flex-col min-h-screen bg-[#fafafa]">
        <AuthProvider>
          <CartProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
