import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { NetworkListener } from "@/components/providers/network-listener";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "YourThumb — AI YouTube Thumbnail Designer",
    template: "%s | YourThumb",
  },
  description:
    "Create strategic YouTube thumbnails with an AI workflow for video context, title and thumbnail ideation, human review, reference-driven design, and optional Canva editing.",
  applicationName: "YourThumb",
  keywords: [
    "YouTube thumbnail",
    "AI YouTube thumbnail generator",
    "YouTube thumbnail maker",
    "thumbnail design",
    "YouTube thumbnail ideas",
    "Canva thumbnails",
  ],
  authors: [{ name: "YourThumb" }],
  creator: "YourThumb",
  publisher: "YourThumb",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "YourThumb",
    title: "YourThumb — AI YouTube Thumbnail Designer",
    description:
      "Create strategic YouTube thumbnails with AI ideation, human review, reference-driven design, and optional Canva editing.",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "YourThumb — AI YouTube Thumbnail Designer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YourThumb — AI YouTube Thumbnail Designer",
    description:
      "Create strategic YouTube thumbnails with AI ideation, human review, reference-driven design, and optional Canva editing.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        <NetworkListener>{children}</NetworkListener>
      </body>
    </html>
  );
}
