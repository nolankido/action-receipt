import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Action Receipt | Know what’s next. Keep the proof.",
  description: "Review the actions in a notice, check their source evidence, clarify dates, and export only what you approve.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
