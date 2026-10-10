import type { Metadata } from "next";
import { Suspense } from "react";
import { TicketView } from "@/components/TicketView";

export const metadata: Metadata = {
  title: "Vé Vào Sân Thi Đấu • FC Rất Chuyên (Tear Ticket)",
  description:
    "Vé vào sân cầu lông tương tác Tear Ticket (React Bits) với ảnh đội hình FC Rất Chuyên tại Nhà Thi Đấu Quán Thánh.",
};

export default function TicketPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <TicketView />
    </Suspense>
  );
}
