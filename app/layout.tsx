import { Clarity } from "@/components/Clarity";
import { Toaster } from "@/components/ui/toaster";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Screen Share - Share Your Screen Instantly",
    description: "Share your screen instantly with anyone using a simple room code. No downloads or sign-ups required.",
    keywords: "screen sharing, webrtc, online screen share, browser screen sharing, free screen sharing"
} satisfies Metadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="relative">
                    {children}
                    <footer className="absolute py-8 bottom-0 left-0 right-0 text-center text-gray-500 text-sm">
                        Built by{" "}
                        <Link href="https://tonghohin.vercel.app" className="underline" target="_blank">
                            Hin
                        </Link>
                        . The source code is available on{" "}
                        <Link href="https://github.com/tonghohin/screen-sharing" className="underline" target="_blank">
                            Github
                        </Link>
                        .
                    </footer>
                </div>
                <Clarity />
                <Toaster />
            </body>
        </html>
    );
}
