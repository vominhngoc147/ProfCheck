import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header, Footer } from "@/components/header";
import { getDictionary, getLocale } from "@/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ProfCheck — Đánh giá giảng viên cho sinh viên",
    template: "%s | ProfCheck",
  },
  description:
    "Nền tảng đánh giá giảng viên dành cho sinh viên Việt Nam: dạy hay, chấm công bằng, chọn người hướng dẫn NCKH/khóa luận phù hợp.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer disclaimer={dict.footer.disclaimer} />
      </body>
    </html>
  );
}
