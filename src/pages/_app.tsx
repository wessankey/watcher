import { type AppType } from "next/app";

import { api } from "~/utils/api";
import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <main className={`${inter.variable} font-sans`}>
      <ClerkProvider {...pageProps}>
        <Component {...pageProps} />
        <div id="modal-portal"></div>
      </ClerkProvider>
    </main>
  );
};

export default api.withTRPC(MyApp);
