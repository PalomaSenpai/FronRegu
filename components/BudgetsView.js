'use client';
import { useEffect, useState } from 'react';
import { FiPlus, FiAlertTriangle, FiCheckCircle, FiDollarSign, FiCalendar } from 'react-icons/fi';
import styles from './budgets.module.css';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    categoryId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    limitAmount: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener el userId del localStorage
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('No se encontraron datos de usuario');
        }

        const { userId } = JSON.parse(userData);
        
        // Hacer peticiones en paralelo
        const [budgetsRes, categoriesRes, transactionsRes] = await Promise.all([
          fetch(`https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/budgets/${userId}`),
          fetch(`https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/categories`),
          fetch(`https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/transactions/${userId}`)
        ]);

        if (!budgetsRes.ok || !categoriesRes.ok || !transactionsRes.ok) {
          throw new Error('Error al obtener datos');
        }

        const [budgetsData, categoriesData, transactionsData] = await Promise.all([
          budgetsRes.json(),
          categoriesRes.json(),
          transactionsRes.json()
        ]);

        setBudgets(budgetsData);
        setCategories(categoriesData.categories.filter(c => c.categoryType === 'expense'));
        setTransactions(transactionsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'month' || name === 'year' ? parseInt(value) : value
    }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      throw new Error('No se encontraron datos de usuario');
    }
    const { userId } = JSON.parse(userData);

    // Generar budgetId en el formato categoryId#year#month
    const budgetId = `${formData.categoryId}#${formData.year}#${String(formData.month).padStart(2, '0')}`;

    // Formatear los datos según lo que espera el backend
    const budgetData = {
      userId,
      budgetId, // Agregar budgetId
      categoryId: formData.categoryId,
      month: formData.month,
      year: formData.year,
      yearMonth: `${formData.year}#${String(formData.month).padStart(2, '0')}`,
      limitAmount: parseFloat(formData.limitAmount),
    };

    const response = await fetch(
      `https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/budgets`, // Corregir URL a 'presupuestos'
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear presupuesto');
    }

    const newBudget = await response.json();
    setBudgets((prev) => [...prev, newBudget.budget]); // Ajustar según la respuesta del backend
    setShowForm(false);
    setFormData({
      categoryId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      limitAmount: '',
    });
  } catch (err) {
    console.error('Error creating budget:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  // Calcular gastos por categoría/mes
  const calculateSpending = (categoryId, month, year) => {
    return transactions
      .filter(t => 
        t.categoryId === categoryId && 
        t.transactionType === 'expense' &&
        new Date(t.date).getMonth() + 1 === month &&
        new Date(t.date).getFullYear() === year
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Obtener nombre de categoría
  const getCategoryName = (categoryId) => {
    return categories.find(c => c.categoryId === categoryId)?.categoryName || categoryId;
  };

  // Obtener nombre del mes
  const getMonthName = (month) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1];
  };

  if (loading) {
    return <div className={styles.container}>Cargando...</div>;
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestión de Presupuestos</h1>
        <button 
          className={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          <FiPlus /> {showForm ? 'Cancelar' : 'Nuevo Presupuesto'}
        </button>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <h2>Crear Nuevo Presupuesto</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Categoría</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map(category => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Mes</label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  required
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Año</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="2000"
                  max="2100"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Límite de gasto</label>
              <div className={styles.amountInput}>
                <FiDollarSign />
                <input
                  type="number"
                  name="limitAmount"
                  value={formData.limitAmount}
                  onChange={handleInputChange}
                  min="1"
                  step="0.01"
                  placeholder="Ej. 5000"
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.submitButton}>
              Guardar Presupuesto
            </button>
          </form>
        </div>
      )}

      <div className={styles.budgetsGrid}>
        {budgets.length > 0 ? (
          budgets.map(budget => {
            const spent = calculateSpending(budget.categoryId, budget.month, budget.year);
            const percentage = (spent / budget.limitAmount) * 100;
            const isOverBudget = percentage >= 100;
            const isNearLimit = percentage >= 80 && percentage < 100;

            return (
              <div key={budget.budgetId} className={styles.budgetCard}>
                <div className={styles.budgetHeader}>
                  <h3>{getCategoryName(budget.categoryId)}</h3>
                  <span className={styles.budgetPeriod}>
                    <FiCalendar /> {getMonthName(budget.month)} {budget.year}
                  </span>
                </div>

                <div className={styles.budgetProgress}>
                  <div className={styles.progressBar}>
                    <div 
                      className={`${styles.progressFill} ${isOverBudget ? styles.overBudget : ''}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className={styles.progressText}>
                    <span>${spent.toLocaleString()}</span>
                    <span>${budget.limitAmount.toLocaleString()}</span>
                  </div>
                </div>

                {(isOverBudget || isNearLimit) && (
                  <div className={`${styles.alert} ${isOverBudget ? styles.alertDanger : styles.alertWarning}`}>
                    {isOverBudget ? (
                      <><FiAlertTriangle /> Has excedido tu presupuesto por ${(spent - budget.limitAmount).toLocaleString()}</>
                    ) : (
                      <><FiAlertTriangle /> Estás cerca de alcanzar tu límite (${budget.limitAmount - spent} restantes)</>
                    )}
                  </div>
                )}

                {percentage < 80 && (
                  <div className={styles.alertSuccess}>
                    <FiCheckCircle /> Buen progreso (${budget.limitAmount - spent} restantes)
                  </div>
                )}

                <div className={styles.budgetActions}>
                  <button className={styles.editButton}>Editar</button>
                  <button className={styles.deleteButton}>Eliminar</button>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <p>No tienes presupuestos configurados</p>
            <button 
              className={styles.addButton}
              onClick={() => setShowForm(true)}
            >
              <FiPlus /> Crear mi primer presupuesto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}