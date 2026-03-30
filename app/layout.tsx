import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // The root URL of the deployed site. All relative OG image paths
  // (like "/logo.png") are resolved against this base.
  // CHANGE THIS to your real production domain when you deploy.
  metadataBase: new URL("https://www.goodcode.co.za"),

  // Using a template gives every page a consistent tab title format.
  // A child page that exports  title: "Services"  will produce:
  //   "Services | Good Code"
  title: {
    default: "Good Code | Web, Mobile & Cloud Development",
    template: "%s | Good Code",
  },

  // The description shown below your link in Google search results.
  // Keep it natural, under ~155 characters, and include key terms.
  description:
    "Good Code is a Polokwane-based software studio building web, mobile, and cloud solutions. From strategy to deployment, we deliver fast, maintainable digital products.",

  keywords: [
    "web development",
    "mobile app development",
    "cloud solutions",
    "IT consulting",
    "software development",
    "Polokwane",
    "South Africa",
    "Good Code",
  ],

  authors: [{ name: "Good Code", url: "https://www.goodcode.co.za" }],

  // Open Graph tags control the preview card shown when someone shares
  // your link on Facebook, LinkedIn, WhatsApp, Slack, Discord, etc.
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: "Good Code",
    title: "Good Code | Web, Mobile & Cloud Development",
    description:
      "Polokwane-based software studio building web, mobile, and cloud solutions.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Good Code logo",
      },
    ],
  },

  // Twitter (X) card — controls the preview when shared on X.
  twitter: {
    card: "summary_large_image",
    title: "Good Code | Web, Mobile & Cloud Development",
    description:
      "Polokwane-based software studio building web, mobile, and cloud solutions.",
    images: ["/logo.png"],
  },

  icons: {
    icon: "/icon_logo.png",
    apple: "/icon_logo.png",
  },

  // Explicitly allow search engines to crawl and index.
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Structured data (JSON-LD) — tells Google this site belongs to
            an organisation called "Good Code" with this address, phone, etc.
            Google may display it as a Knowledge Panel in search results. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Good Code",
              url: "https://www.goodcode.co.za",
              logo: "https://www.goodcode.co.za/logo.png",
              description:
                "Polokwane-based software studio building web, mobile, and cloud solutions.",
              address: {
                "@type": "PostalAddress",
                streetAddress: "123 Code Street",
                addressLocality: "Polokwane",
                addressRegion: "Limpopo",
                postalCode: "0699",
                addressCountry: "ZA",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+27-12-345-6789",
                contactType: "customer service",
                areaServed: "ZA",
                availableLanguage: "English",
              },
              sameAs: [
                // Add your social media URLs here when you have them:
                // "https://www.linkedin.com/company/good-code",
                // "https://github.com/good-code",
              ],
            }),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Navbar />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
