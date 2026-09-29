import '@/app/globals.css';
import Script from 'next/script';
import ReactQueryProvider from '@/components/common/ReactQueryProvider';
import Header from '@/components/common/Header';

export const metadata = {
  title: '컬쳐맵 - 통합 문화생활 정보 서비스',
  description: '날짜와 위치 기반 영화, 공연, 행사, 전시 통합 탐색 플랫폼',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="antialiased font-sans text-slate-800 bg-slate-50">
        <Header />
        <ReactQueryProvider>{children}</ReactQueryProvider>

        {/* 네이버 지도 SDK 스크립트 비동기 로드 */}
        {process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID && (
          <Script
            src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
            strategy="beforeInteractive"
          />
        )}
      </body>
    </html>
  );
}