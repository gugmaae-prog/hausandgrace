import type { Metadata } from "next";
import { SiteMotion } from "@/components/SiteMotion";
import { withBasePath } from "@/lib/base-path";
import { SITE_ORIGIN } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: "HAUS & GRACE | UAE Real Estate & Investment", template: "%s | HAUS & GRACE" },
  description: "Private-client UAE real estate and investment advisory focused on acquisition, performance and long-term value.",
  applicationName: "HAUS & GRACE Properties",
  category: "real estate",
  keywords: ["UAE real estate", "Dubai property", "UAE property investment", "off-plan UAE", "HAUS & GRACE"],
  authors: [{ name: "HAUS & GRACE Properties" }],
  creator: "HAUS & GRACE Properties",
  publisher: "HAUS & GRACE Properties",
  icons: { icon: withBasePath("/favicon.svg"), shortcut: withBasePath("/favicon.svg") },
  openGraph: {
    type: "website",
    url: SITE_ORIGIN,
    siteName: "HAUS & GRACE",
    title: "HAUS & GRACE | UAE Real Estate & Investment",
    description: "Private-client UAE real estate and investment advisory focused on acquisition, performance and long-term value.",
    images: [{ url: `${SITE_ORIGIN}/og.png`, width: 1732, height: 908, alt: "HAUS & GRACE UAE real estate and investment" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HAUS & GRACE | UAE Real Estate & Investment",
    description: "Private-client UAE real estate and investment advisory focused on acquisition, performance and long-term value.",
    images: [`${SITE_ORIGIN}/og.png`],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "HAUS & GRACE Properties",
    url: SITE_ORIGIN,
    telephone: "+971566215655",
    address: { "@type": "PostalAddress", streetAddress: "Office 1142, Xavier Business Center, Ibn Battuta Gate", addressLocality: "Dubai", addressCountry: "AE" },
  };
  return <html lang="en"><body><SiteMotion />{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></body></html>;
}
