import '../app/globals.css';
import Sidebar from '../../components/Sidebar';

export const metadata = {
  title: 'Dashboard App',
  description: 'Admin dashboard con App Router',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem' }}>{children}</main>
      </body>
    </html>
  );
}
