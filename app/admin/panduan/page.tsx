import type { Metadata } from "next";
import AdminGuidePage from "@/components/AdminGuidePage";

export const metadata: Metadata = {
  title: "Panduan Admin | NyalaLagi",
  description: "Panduan operasional lengkap fitur NyalaLagi untuk administrator.",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <AdminGuidePage />;
}
