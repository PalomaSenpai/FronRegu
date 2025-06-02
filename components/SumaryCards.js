import styles from './components.module.css';

export default function SummaryCards() {
  const summary = [
    { title: 'Saldo Total', value: '$12,500', color: '#10b981' },
    { title: 'Ingresos', value: '$7,000', color: '#3b82f6' },
    { title: 'Egresos', value: '$3,200', color: '#ef4444' },
  ];

  return (
    <div className={styles.cards}>
      {summary.map((item) => (
        <div
          key={item.title}
          className={styles.card}
          style={{ background: item.color }}
        >
          <h4>{item.title}</h4>
          <h2>{item.value}</h2>
        </div>
      ))}
    </div>
  );
}
