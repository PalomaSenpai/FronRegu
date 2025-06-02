'use client';
import styles from './dashboard.module.css';

import SummaryCards from '../../../components/SumaryCards';
import IncomeExpenseChart from '../../../components/IncomeExpenseChart';
import RecentTransactions from '../../../components/RecentTransactions';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard Financiero</h1>
      <SummaryCards />
      <IncomeExpenseChart />
      <RecentTransactions />
    </div>
  );
}
