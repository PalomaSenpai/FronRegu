'use client';
import styles from './components.module.css';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const data = [
  { name: 'Ene', Ingresos: 4000, Egresos: 2400 },
  { name: 'Feb', Ingresos: 3000, Egresos: 1398 },
  { name: 'Mar', Ingresos: 5000, Egresos: 2800 },
];

export default function IncomeExpenseChart() {
  return (
    <div className={styles.chartContainer}>
      <h3>Ingresos vs Egresos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="Ingresos" fill="#3b82f6" />
          <Bar dataKey="Egresos" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
