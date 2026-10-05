import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../features/auth/application/auth.context';
import { Navbar } from '../shared/components/Navbar';

export const metadata: Metadata = {
  title: 'ChaosLauncher - Web Studio & Modpacks',
  description: 'Plataforma oficial de gestión y catálogo de modpacks de ChaosLauncher',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/assets/chaos_icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/assets/chaos_icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#080505] text-white flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
