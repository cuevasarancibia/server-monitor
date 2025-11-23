import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monitor de Servidores',
  description: 'Aplicación para revisar servidores bajo demanda',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
