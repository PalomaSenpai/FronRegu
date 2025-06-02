import styles from './components.module.css';

export default function RecentTransactions() {
  const transactions = [
    { date: '2025-05-30', concept: 'Sueldo', amount: 4000 },
    { date: '2025-05-28', concept: 'Supermercado', amount: -200 },
    { date: '2025-05-25', concept: 'Renta', amount: -900 },
  ];

  return (
    <div className={styles.tableContainer}>
      <h3>Movimientos Recientes</h3>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={i}>
              <td>{t.date}</td>
              <td>{t.concept}</td>
              <td style={{ color: t.amount < 0 ? '#ef4444' : '#10b981' }}>
                {t.amount < 0 ? '-' : '+'}${Math.abs(t.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
