import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Healthcare Scheduling",
  description: "Healthcare Scheduling System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
