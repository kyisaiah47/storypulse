import type { Metadata } from "next";
import { Inter_Tight, Geist_Mono } from "next/font/google";
import "./globals.css";

// Replace Geist Sans with Inter Tight
const interTight = Inter_Tight({
	variable: "--font-inter-tight",
	subsets: ["latin"],
	weight: ["400", "600", "800"], // regular, semi-bold, extra-bold
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "StoryPulse",
	description: "An immersive AI-powered storytelling experience",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${interTight.variable} ${geistMono.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
