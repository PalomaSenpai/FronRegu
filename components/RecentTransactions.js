"use client";
import { useEffect, useState } from 'react';
import styles from './components.module.css';
import { FiArrowUp, FiArrowDown, FiDollarSign, FiCreditCard, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener el userId del localStorage
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('No se encontraron datos de usuario');
        }

        const { userId } = JSON.parse(userData);
        
        // Hacer la petición al backend para obtener transacciones
        const response = await fetch(
          `https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/transactions/${userId}`
        );

        if (!response.ok) {
          throw new Error('Error al obtener las transacciones');
        }

        const data = await response.json();
        setTransactions(data);

        // Calcular balance total y gastos del mes actual
        calculateFinancialData(data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const calculateFinancialData = (transactions) => {
      let totalBalance = 0;
      let currentMonthExpenses = 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        
        // Sumar al balance total
        if (transaction.transactionType === 'income') {
          totalBalance += transaction.amount;
        } else if (transaction.transactionType === 'expense') {
          totalBalance -= transaction.amount;
        }

        // Calcular gastos del mes actual
        if (transaction.transactionType === 'expense' && 
            transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
          currentMonthExpenses += transaction.amount;
        }
      });

      setBalance(totalBalance);
      setMonthlyExpenses(currentMonthExpenses);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className={styles.chartContainer}>Cargando datos...</div>;
  }

  if (error) {
    return <div className={styles.chartContainer}>Error: {error}</div>;
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('es-MX', options);
  };

  return (
    <div className={styles.container}>
      {/* Tarjetas de resumen */}
      <div className={styles.cards}>
        <div className={styles.card} style={{ background: '#3b82f6' }}>
          <div className={styles.cardHeader}>
            <FiDollarSign size={24} />
            <h3>Balance Total</h3>
          </div>
          <div className={styles.cardAmount}>
            ${balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={styles.cardTrend}>
            <FiTrendingUp size={20} />
            <span>Último mes</span>
          </div>
        </div>

        <div className={styles.card} style={{ background: '#ef4444' }}>
          <div className={styles.cardHeader}>
            <FiCreditCard size={24} />
            <h3>Gastos del Mes</h3>
          </div>
          <div className={styles.cardAmount}>
            ${monthlyExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={styles.cardTrend}>
            <FiTrendingDown size={20} />
            <span>Mes actual</span>
          </div>
        </div>
      </div>

      {/* Movimientos recientes */}
      <div className={styles.recentTransactions}>
        <h3>Movimientos Recientes</h3>
        {transactions.length > 0 ? (
          <div className={styles.transactionList}>
            {transactions.slice(0, 5).map((transaction, index) => (
              <div key={index} className={styles.transactionCard}>
                <div className={styles.transactionIcon}>
                  {transaction.transactionType === 'income' ? (
                    <FiArrowUp size={20} color="#10b981" />
                  ) : (
                    <FiArrowDown size={20} color="#ef4444" />
                  )}
                </div>
                <div className={styles.transactionInfo}>
                  <div className={styles.transactionConcept}>
                    {transaction.notes || transaction.categoryId}
                  </div>
                  <div className={styles.transactionDate}>
                    {formatDate(transaction.date)}
                  </div>
                </div>
                <div 
                  className={styles.transactionAmount}
                  style={{ color: transaction.transactionType === 'income' ? '#10b981' : '#ef4444' }}
                >
                  {transaction.transactionType === 'income' ? '+' : '-'}
                  ${transaction.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay movimientos recientes</p>
        )}
      </div>
    </div>
  );
}