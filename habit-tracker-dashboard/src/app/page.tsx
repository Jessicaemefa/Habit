"use client";
import dynamic from "next/dynamic";

// ssr: false prevents server render of Dashboard, so lazy useState initializers
// only run on the client where localStorage is available — no skeleton flash.
const Dashboard = dynamic(
  () => import("@/components/Dashboard").then((m) => ({ default: m.Dashboard })),
  { ssr: false },
);

export default function Home() {
  return <Dashboard />;
}
