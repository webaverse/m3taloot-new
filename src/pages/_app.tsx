import type { AppProps } from "next/app";
import 'bootstrap/dist/css/bootstrap.css';
import 'tailwindcss/tailwind.css'

const MyApp = function ({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
};

export default MyApp;
