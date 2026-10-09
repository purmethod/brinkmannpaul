import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { AppProvider } from "@/lib/app-context";
import { NativeLinks } from "@/components/NativeLinks";
import { ServiceWorker } from "@/components/ServiceWorker";

const SPLASH: [number, number, number][] = [
  [1320, 2868, 3], [1206, 2622, 3], [1290, 2796, 3], [1179, 2556, 3], [1284, 2778, 3],
  [1170, 2532, 3], [1125, 2436, 3], [1242, 2688, 3], [828, 1792, 2], [1242, 2208, 3], [750, 1334, 2],
];

export const metadata: Metadata = {
  title: "Cyclemax",
  description: "Sei der Fels in der Brandung. Be the Cycleman.",
  applicationName: "Cyclemax",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Cyclemax",
    statusBarStyle: "default",
    startupImage: SPLASH.map(([w, h, r]) => ({
      url: `/splash/apple-splash-${w}x${h}.png`,
      media: `(device-width: ${w / r}px) and (device-height: ${h / r}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    })),
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <AppProvider>{children}</AppProvider>
        <ServiceWorker />
        <NativeLinks />
      </body>
    </html>
  );
}
