// pages/_app.js
import '../styles/globals.css';
import '../styles/SalesForm.css';
import { SessionProvider } from 'next-auth/react';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    // refetchInterval: baca ulang sesi tiap 10 menit supaya access token Keycloak
    // (masa berlaku 3 jam) diperbarui otomatis lewat refresh token sebelum
    // kedaluwarsa — kalau tidak, semua panggilan API akan ditolak 401
    // ("Token tidak valid atau kadaluarsa") walau user masih login.
    <SessionProvider session={session} refetchInterval={10 * 60} refetchOnWindowFocus>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;