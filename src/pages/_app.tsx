import { type AppType } from "next/app";

import { api } from "~/utils/api";
import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Poppins } from "next/font/google";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const inter = Poppins({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-poppins",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <main className={`${inter.variable} font-sans`}>
        <ClerkProvider {...pageProps}>
          <Component {...pageProps} />
          <div id="modal-portal"></div>
        </ClerkProvider>
      </main>
      <ReactQueryDevtools />
    </>
  );
};

export default api.withTRPC(MyApp);
