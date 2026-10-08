# Cầu Lông Rất Chuyên 🏸

Ứng dụng web hiện đại giúp tính toán và chia tiền sân, tiền cầu, tiền nước cho các buổi chơi cầu lông công bằng & nhanh gọn giữa Nam và Nữ.

Chuyển đổi từ file đơn lẻ HTML sang dự án **Next.js 16 (App Router)** với **React 19**, **Tailwind CSS v4** và **TypeScript**.

## 🌟 Tính Năng Nổi Bật

- 🧮 **Tính tiền công bằng**:
  - Tự động tính tổng chi phí (tiền sân + quả cầu x đơn giá + nước/phụ phí).
  - Công thức chia tiền hợp lý: Nữ mặc định đóng 75% so với Nam (`Tiền Nam = Tổng / (Nam + 0.75 * Nữ)`).
  - Tùy chỉnh linh hoạt tỉ lệ đóng cho Nữ (75%, 80%, 50%, hoặc 100% chia đều).
  - Tùy chọn làm tròn tiền: Chuẩn xác, Tròn 1.000 đ hoặc Tròn 5.000 đ.
- 🐈🏸 **Mascot Pixel Art độc quyền**: Render SVG sắc nét hình chú mèo và vợt cầu lông bằng pixel art thuần.
- 📋 **Sao chép tin nhắn Zalo/Messenger 1-click**: Tạo sẵn đoạn tin nhắn đẹp mắt, chi tiết để gửi ngay vào nhóm chat kèm hiệu ứng pháo giấy confetti.
- 📲 **Hỗ trợ Web Share API**: Chia sẻ trực tiếp qua ứng dụng trên điện thoại (Zalo, Messenger, Telegram).
- 💳 **Tạo mã VietQR Chuyển Khoản**: Nhập STK & Ngân hàng để tạo mã QR ngân hàng tự động điền sẵn số tiền cho từng bạn quét chuyển khoản tức thì.
- 📜 **Lịch sử buổi chơi**: Lưu trữ các buổi chơi trước đó vào bộ nhớ trình duyệt, có thể xem lại hoặc nạp lại thông số chỉ bằng một nút bấm.
- 🌓 **Giao diện Sáng / Tối (Dark Mode)**: Tự động nhận diện theme hệ thống hoặc chọn thủ công (Light / Dark / System), chống chớp giật màn hình (No-FOUC).
- 💾 **Tự động lưu trữ (Auto-save)**: Dữ liệu được lưu an toàn trong `localStorage` với tương thích ngược 100% phiên bản HTML cũ.

---

## 🛠️ Công Nghệ Sử Dụng

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Effects**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### 1. Clone repository
```bash
git clone https://github.com/imtiendat0311/caulongratchuyen.git
cd caulongratchuyen
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Chạy môi trường phát triển (Dev)
```bash
npm run dev
```
Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

### 4. Build sản phẩm (Production)
```bash
npm run build
npm start
```

---

## 📁 Cấu Trúc Thư Mục

```text
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css      # CSS variables & Tailwind v4
│   │   ├── layout.tsx       # Root layout & Vietnamese SEO metadata
│   │   └── page.tsx         # Trang chủ
│   ├── components/
│   │   ├── BadmintonCalculator.tsx  # Bộ tính toán chính
│   │   ├── NumberInput.tsx          # Ô nhập số kèm nút tăng/giảm (+/-)
│   │   ├── PixelArt.tsx             # Mascot SVG Mèo & Vợt pixel
│   │   ├── ThemeToggle.tsx          # Đổi theme Sáng/Tối/Hệ thống
│   │   ├── VietQRModal.tsx          # Modal mã QR chuyển khoản VietQR
│   │   └── HistoryDrawer.tsx        # Danh sách lịch sử các buổi chơi
│   ├── lib/
│   │   └── store.ts         # Quản lý state & LocalStorage (useSyncExternalStore)
│   └── types/
│       └── index.ts         # TypeScript definitions
└── Cầu Lông Rất Chuyên (FINAL).html # Bản gốc HTML để đối chiếu
```

---

## 📄 License

Dự án phát hành theo mã nguồn mở dành cho cộng đồng đam mê cầu lông! 🏸
