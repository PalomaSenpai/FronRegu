"use client";
import { useEffect, useState } from 'react';
import styles from './components.module.css';

export default function SummaryCards() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        // Obtener el userId del localStorage
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('No se encontraron datos de usuario');
        }

        const { userId } = JSON.parse(userData);
        
        // Hacer la petición al backend
        const response = await fetch(
          `https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/accounts/${userId}`
        );

        if (!response.ok) {
          throw new Error('Error al obtener las cuentas');
        }

        const data = await response.json();
        setAccounts(data);
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  if (loading) {
    return <div className={styles.cards}>Cargando cuentas...</div>;
  }

  if (error) {
    return <div className={styles.cards}>Error: {error}</div>;
  }

  if (accounts.length === 0) {
    return <div className={styles.cards}>No se encontraron cuentas</div>;
  }

  return (
    <div className={styles.cards}>
      {accounts.map((account) => {
        // Determinar el color según el tipo de cuenta
        let color;
        switch (account.accountType) {
          case 'cash':
            color = '#10b981'; // Verde para efectivo
            break;
          case 'debit':
            color = '#3b82f6'; // Azul para débito
            break;
          case 'credit':
            color = '#ef4444'; // Rojo para crédito
            break;
          default:
            color = '#6b7280'; // Gris por defecto
        }

        return (
          <div
            key={account.accountId}
            className={styles.card}
            style={{ background: color }}
          >
            <h4>{account.accountName}</h4>
            <h2>${account.balance.toLocaleString()}</h2>
          </div>
        );
      })}
    </div>
  );
}