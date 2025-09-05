import type { Metadata } from "next";
import { Saira } from "next/font/google";
import "./globals.css";
import OtelClientInit from "@/components/otel-client-init";

const saira = Saira({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Form Example",
  description:
    "Form Example with React Hook Form, zod, Next.js and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`flex items-center justify-center p-20 ${saira.className}`}
      >
        <OtelClientInit />
        {children}
      </body>
    </html>
  );
}
