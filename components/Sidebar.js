'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menu = [
  { label: 'Inicio', href: '/transacciones' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Configuración', href: '/budgets' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: '220px',
      background: '#111827',
      color: 'white',
      padding: '1rem',
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Admin Panel</h3>
      <ul>
        {menu.map(({ label, href }) => (
          <li key={href} style={{ margin: '8px 0' }}>
            <Link
              href={href}
              style={{
                color: pathname === href ? '#3B82F6' : 'white',
                textDecoration: 'none'
              }}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
