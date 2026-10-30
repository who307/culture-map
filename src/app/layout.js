import '@/app/globals.css';
import Script from 'next/script';
import ReactQueryProvider from '@/components/common/ReactQueryProvider';
import Header from '@/components/common/Header';
import DateRangeDock from '@/components/common/DateRangeDock';

// 첫 페인트 전에 테마 클래스를 붙여 다크모드 깜빡임을 막음
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.dataset.theme='dark'}catch(e){}`;

export const metadata = {
  title: '컬처맵 - 통합 문화생활 정보 서비스',
  description: '날짜와 위치 기반 영화, 공연, 행사, 전시 통합 탐색 플랫폼',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f3f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1014' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-paper font-sans text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper"
        >
          본문 바로가기
        </a>
        <Header />
        <DateRangeDock />
        <ReactQueryProvider>{children}</ReactQueryProvider>

        {/* 네이버 지도 SDK 스크립트 비동기 로드 */}
        {process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID && (
          <Script
            src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
            strategy="beforeInteractive"
          />
        )}
      </body>
    </html>
  );
}
