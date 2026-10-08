import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://caulongratchuyen.vercel.app"),
  title: "Cầu Lông Rất Chuyên - FC Rất Chuyên",
  description:
    "Ứng dụng tính tiền chia sau mỗi buổi chơi cầu lông công bằng & nhanh gọn cho FC Rất Chuyên.",
  keywords: [
    "cầu lông",
    "tính tiền cầu lông",
    "chia tiền cầu lông",
    "cầu lông rất chuyên",
    "fc rất chuyên",
    "badminton cost calculator",
  ],
  authors: [{ name: "FC Rất Chuyên" }],
  icons: {
    icon: "/team-photo.jpg",
    apple: "/team-photo.jpg",
  },
  openGraph: {
    title: "Cầu Lông Rất Chuyên - FC Rất Chuyên",
    description: "Tính tiền chia sau mỗi buổi chơi cầu lông công bằng & nhanh gọn.",
    images: [{ url: "/team-photo.jpg", width: 960, height: 960, alt: "FC Rất Chuyên" }],
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
    <html lang="vi" suppressHydrationWarning>
      <head>
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
