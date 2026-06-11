import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocQuery",
  description: "AI Research & Document Intelligence Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#09090b", color: "#fafafa", height: "100dvh", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
