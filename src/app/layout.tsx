import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silventory | Tailoring work, in order",
  description: "A simple workspace for tailoring requests, customer contacts, and delivery dates.",
};

export const viewport: Viewport = {
  themeColor: "#7753c8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
