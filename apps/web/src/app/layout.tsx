import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatCart Pro — App",
  description: "AI-native WhatsApp Business messaging platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
