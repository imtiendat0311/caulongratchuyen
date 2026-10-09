import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cầu Lông Rất Chuyên",
    short_name: "Cầu Lông RC",
    description: "Ứng dụng tính tiền chia sân cầu lông công bằng & nhanh gọn cho FC Rất Chuyên",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/team-photo.jpg",
        sizes: "960x960",
        type: "image/jpeg",
      },
    ],
  };
}
