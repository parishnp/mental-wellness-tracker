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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
