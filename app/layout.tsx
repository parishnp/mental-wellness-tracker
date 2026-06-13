import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExamCompanion — Student Wellness",
  description:
    "Finds the hidden stress pattern in a student's journal and turns it into a personalized, exam-culture-aware intervention.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
