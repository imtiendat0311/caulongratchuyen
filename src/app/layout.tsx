import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL("https://caulongratchuyen.vercel.app"),
  title: {
    default: "Cầu Lông Rất Chuyên - Chia Tiền Sân Cầu Lông Nhanh & Chuẩn",
    template: "%s | Cầu Lông Rất Chuyên",
  },
  description:
    "Ứng dụng tính tiền chia sau mỗi buổi chơi cầu lông công bằng, tự động & chuẩn xác cho các câu lạc bộ và nhóm bạn. Hỗ trợ điểm danh thành viên, tạo mã VietQR thanh toán, chia tiền Nam/Nữ và xuất biên lai chi phí.",
  applicationName: "Cầu Lông Rất Chuyên",
  keywords: [
    "cầu lông",
    "chia tiền cầu lông",
    "tính tiền sân cầu lông",
    "cầu lông rất chuyên",
    "fc rất chuyên",
    "tính bill cầu lông",
    "phần mềm tính tiền cầu lông",
    "chia tiền nam nữ",
    "vietqr cầu lông",
    "quản lý câu lạc bộ cầu lông",
    "điểm danh cầu lông",
    "badminton cost calculator",
    "badminton split bill",
    "tiền sân cầu lông",
    "biên lai cầu lông",
  ],
  authors: [{ name: "FC Rất Chuyên", url: "https://caulongratchuyen.vercel.app" }],
  creator: "FC Rất Chuyên",
  publisher: "FC Rất Chuyên",
  category: "Sports & Utilities",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/team-photo.jpg", sizes: "960x960", type: "image/jpeg" },
    ],
    apple: [
      { url: "/team-photo.jpg", sizes: "960x960", type: "image/jpeg" },
    ],
    shortcut: ["/team-photo.jpg"],
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://caulongratchuyen.vercel.app",
    siteName: "Cầu Lông Rất Chuyên",
    title: "Cầu Lông Rất Chuyên - Chia Tiền Sân Cầu Lông Nhanh & Chuẩn",
    description:
      "Ứng dụng tính tiền chia sân cầu lông công bằng, tự động tạo mã VietQR nhận tiền, xuất hóa đơn biên lai và quản lý điểm danh thành viên.",
    images: [
      {
        url: "https://caulongratchuyen.vercel.app/og-banner.jpg",
        secureUrl: "https://caulongratchuyen.vercel.app/og-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Cầu Lông Rất Chuyên - Chia Tiền Sân Cầu Lông Nhanh & Chuẩn",
        type: "image/jpeg",
      },
      {
        url: "https://caulongratchuyen.vercel.app/team-photo.jpg",
        secureUrl: "https://caulongratchuyen.vercel.app/team-photo.jpg",
        width: 960,
        height: 960,
        alt: "Ảnh đội hình Cầu Lông FC Rất Chuyên",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cầu Lông Rất Chuyên - Chia Tiền Sân Cầu Lông Nhanh & Chuẩn",
    description:
      "Tính tiền sân, tiền cầu, tiền nước nhanh chóng, chia đều Nam/Nữ và tạo mã VietQR thanh toán tiện lợi.",
    images: ["https://caulongratchuyen.vercel.app/og-banner.jpg"],
    creator: "@caulongratchuyen",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#13161f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Cầu Lông Rất Chuyên",
              url: "https://caulongratchuyen.vercel.app",
              applicationCategory: "SportsApplication",
              operatingSystem: "All",
              description:
                "Ứng dụng tính tiền chia sau mỗi buổi chơi cầu lông công bằng, tự động & chuẩn xác cho các câu lạc bộ và nhóm bạn. Hỗ trợ điểm danh thành viên, tạo mã VietQR thanh toán, chia tiền Nam/Nữ và xuất hóa đơn chi phí.",
              image: "https://caulongratchuyen.vercel.app/team-photo.jpg",
              author: {
                "@type": "Organization",
                name: "FC Rất Chuyên",
                url: "https://caulongratchuyen.vercel.app",
                logo: "https://caulongratchuyen.vercel.app/team-photo.jpg",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "VND",
              },
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased select-none">{children}</body>
    </html>
  );
}
