/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    reactCompiler: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "picsum.photos",
            },
            {
                protocol: "http",
                hostname: "www.culture.go.kr",
                pathname: "/upload/**",
            },
            {
                protocol: "http",
                hostname: "www.kopis.or.kr",
            },
            {
                protocol: "https",
                hostname: "www.kopis.or.kr",
            },
            {
                protocol: "https",
                hostname: "tong.visitkorea.or.kr",
                pathname: "/**",
            },
            // (선택사항) 한국관광공사 API가 간혹 다른 도메인 이미지 주소를 줄 때를 대비해 함께 등록하면 좋습니다.
            {
                protocol: "http",
                hostname: "tong.visitkorea.or.kr",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
