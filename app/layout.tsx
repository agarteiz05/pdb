import type { Metadata } from "next";
import { Prata, Work_Sans } from "next/font/google";
import "./globals.css";

const prata = Prata({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-prata",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Paquete de besos ilimitados",
  description: "El mapa de tu viaje por Paquete de besos ilimitados, de Aly Sanchez.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${prata.variable} ${workSans.variable}`}>
      <body className="font-body text-ink">{children}</body>
    </html>
  );
}
