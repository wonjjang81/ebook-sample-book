import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "전자 샘플북",
  description: "사진 분석 기반 자재 검색 전자 샘플북",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
