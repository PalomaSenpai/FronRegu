'use client';
import { useEffect, useState } from 'react';
import styles from './components.module.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid, LineChart, Line
} from 'recharts';

// Colores para diferentes categorías
const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

export default function IncomeExpenseChart() {
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
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

        const transactions = await response.json();
        
        // Procesar datos para ambos gráficos
        processChartData(transactions);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const processChartData = (transactions) => {
      // 1. Procesar datos para gastos por categoría
      const expensesByCategory = {};
      // 2. Procesar datos para ingresos vs gastos mensuales
      const monthlyTotals = {};

      transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString('default', { month: 'short' });
        
        // Inicializar datos mensuales si no existen
        if (!monthlyTotals[monthYear]) {
          monthlyTotals[monthYear] = {
            name: monthName,
            Ingresos: 0,
            Gastos: 0
          };
        }

        // Sumar a ingresos o gastos según el tipo
        if (transaction.transactionType === 'income') {
          monthlyTotals[monthYear].Ingresos += transaction.amount;
        } else if (transaction.transactionType === 'expense') {
          monthlyTotals[monthYear].Gastos += transaction.amount;
          
          // Sumar a categorías para el otro gráfico
          if (!expensesByCategory[transaction.categoryId]) {
            expensesByCategory[transaction.categoryId] = 0;
          }
          expensesByCategory[transaction.categoryId] += transaction.amount;
        }
      });

      // Procesar datos para gráfico de categorías
      const chartCategoryData = Object.keys(expensesByCategory).map(categoryId => ({
        name: formatCategoryName(categoryId),
        value: expensesByCategory[categoryId],
        categoryId
      })).sort((a, b) => b.value - a.value);

      // Procesar datos para gráfico mensual
      const chartMonthlyData = Object.values(monthlyTotals)
        .sort((a, b) => {
          // Ordenar cronológicamente (necesitamos parsear el mes)
          const months = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
          ];
          return months.indexOf(a.name) - months.indexOf(b.name);
        });

      setCategoryData(chartCategoryData);
      setMonthlyData(chartMonthlyData);
    };

    // Función para formatear los nombres de categoría
    const formatCategoryName = (categoryId) => {
      const names = {
        'food': 'Alimentos',
        'transport': 'Transporte',
        'housing': 'Vivienda',
        'entertainment': 'Entretenimiento',
        'health': 'Salud',
        'education': 'Educación',
        'shopping': 'Compras',
        'rent': 'Renta'
      };
      return names[categoryId] || categoryId;
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return <div className={styles.chartContainer}>Cargando datos...</div>;
  }

  if (error) {
    return <div className={styles.chartContainer}>Error: {error}</div>;
  }

  return (
    <div className={styles.chartGrid}>
      {/* Gráfico de Ingresos vs Gastos Mensuales */}
      <div className={styles.chartContainer}>
        <h3>Ingresos vs Gastos Mensuales</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, value === 'Ingresos' ? 'Ingresos' : 'Gastos']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Ingresos" 
                stroke="#10b981" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Gastos" 
                stroke="#ef4444" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>No hay datos suficientes para mostrar el gráfico</p>
        )}
      </div>

      {/* Gráfico de Gastos por Categoría */}
      <div className={styles.chartContainer}>
        <h3>Gastos por Categoría</h3>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={categoryData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            >
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, 'Gasto']}
                labelFormatter={(label) => `Categoría: ${label}`}
              />
              <Bar dataKey="value" name="Gastos">
                {categoryData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p>No hay datos de gastos disponibles</p>
        )}
      </div>
    </div>
  );
}