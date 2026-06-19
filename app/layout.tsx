import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RblxUploads — StarVSK",
  description:
    "Local batch uploader for Roblox Open Cloud Image and Audio assets. Made by StarVSK.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
