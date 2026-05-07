import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MAL Admin" />

        {/* Open Graph / Social Sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="MyAnimeList Admin Panel" />
        <meta property="og:description" content="Manage your anime collection — add, edit, search, and push changes to GitHub." />
        <meta property="og:image" content="https://raw.githubusercontent.com/Shineii86/MyAnimeList/main/assets/logo.png" />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:site_name" content="MyAnimeList Admin" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MyAnimeList Admin Panel" />
        <meta name="twitter:description" content="Manage your anime collection — add, edit, search, and push changes to GitHub." />
        <meta name="twitter:image" content="https://raw.githubusercontent.com/Shineii86/MyAnimeList/main/assets/logo.png" />

        {/* Theme Color */}
        <meta name="description" content="MyAnimeList Admin Panel — manage your anime collection" />
      </Head>
      <body>
        <Main />
        <NextScript />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  console.log('SW registered:', reg.scope);
                }).catch(function(err) {
                  console.log('SW registration failed:', err);
                });
              });
            }
          `
        }} />
      </body>
    </Html>
  );
}
