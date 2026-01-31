import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, AuthProvider, Sidebar } from "@/components";

export const metadata: Metadata = {
  title: "Net Studio - Nimrobo",
  description: "Web interface for Nimrobo's matching network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-64 p-6 bg-background">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
