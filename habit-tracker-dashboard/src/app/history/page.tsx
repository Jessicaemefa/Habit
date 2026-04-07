"use client";
import dynamic from "next/dynamic";

const HistoryPage = dynamic(
  () => import("@/components/HistoryPage").then((m) => ({ default: m.HistoryPage })),
  { ssr: false },
);

export default function Page() {
  return <HistoryPage />;
}
