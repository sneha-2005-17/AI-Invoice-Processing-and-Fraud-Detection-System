import "./globals.css";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeTransition } from "@/components/shell/theme-transition";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ThemeTransition />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

