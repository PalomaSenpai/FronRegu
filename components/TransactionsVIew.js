'use client';
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiCalendar, FiCreditCard, FiType, FiAlertTriangle, FiFilter, FiX } from 'react-icons/fi';
import styles from './transactions.module.css';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nextTransactionId, setNextTransactionId] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: '',
    startDate: '',
    endDate: '',
    transactionType: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    accountId: '',
    categoryId: '',
    transactionType: 'expense',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    receiptUrl: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) throw new Error('No se encontraron datos de usuario');
        
        const { userId, token } = JSON.parse(userData);
        
        const [transactionsRes, accountsRes, categoriesRes] = await Promise.all([
          fetch(`https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/transactions/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/accounts/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/categories`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (!transactionsRes.ok || !accountsRes.ok || !categoriesRes.ok) {
          throw new Error('Error al obtener datos');
        }

        const [transactionsData, accountsData, categoriesData] = await Promise.all([
          transactionsRes.json(),
          accountsRes.json(),
          categoriesRes.json()
        ]);

        setTransactions(transactionsData);
        setAccounts(accountsData);
        setCategories(categoriesData.categories);

        if (transactionsData.length > 0) {
          const lastId = transactionsData.reduce((max, t) => {
            const num = parseInt(t.transactionId.replace('txn', ''));
            return num > max ? num : max;
          }, 0);
          setNextTransactionId(lastId + 1);
        }
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (transaction) => {
    setFormData({
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      transactionType: transaction.transactionType,
      amount: transaction.amount.toString(),
      date: transaction.date.split('T')[0],
      notes: transaction.notes || '',
      receiptUrl: transaction.receiptUrl || ''
    });
    setEditingId(transaction.transactionId);
    setShowForm(true);
  };

  const generateTransactionId = () => {
    const newId = `txn${nextTransactionId.toString().padStart(4, '0')}`;
    setNextTransactionId(prev => prev + 1);
    return newId;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const userData = localStorage.getItem('user');
    if (!userData) throw new Error('Usuario no autenticado');
    const { userId } = JSON.parse(userData);
    const token = JSON.parse(userData).token;

    // Validaciones
    const errors = [];
    if (!formData.accountId) errors.push('Selecciona una cuenta');
    if (!formData.categoryId) errors.push('Selecciona una categoría');
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      errors.push('Monto debe ser un número positivo');
    }
    if (!formData.date || isNaN(new Date(formData.date).getTime())) {
      errors.push('Fecha inválida');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const transactionData = {
      transactionId: editingId || generateTransactionId(),
      accountId: formData.accountId,
      categoryId: formData.categoryId,
      transactionType: formData.transactionType,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
      userId: userId,
      notes: formData.notes || null,
      receiptUrl: formData.receiptUrl || null
    };

    const isEditing = !!editingId;
    let savedTransaction;

    if (isEditing) {
      // Para edición: primero obtenemos la transacción original
      const originalTransaction = transactions.find(t => t.transactionId === editingId);
      if (!originalTransaction) throw new Error('Transacción no encontrada');

      // 1. Revertir el monto original
      const originalAccount = accounts.find(a => a.accountId === originalTransaction.accountId);
      if (!originalAccount) throw new Error('Cuenta original no encontrada');

      const originalBalanceChange = originalTransaction.transactionType === 'income' 
        ? -originalTransaction.amount 
        : originalTransaction.amount;
      
      const intermediateBalance = originalAccount.balance + originalBalanceChange;

      // 2. Aplicar el nuevo monto
      const newBalanceChange = formData.transactionType === 'income' 
        ? parseFloat(formData.amount)
        : -parseFloat(formData.amount);
      
      const newBalance = intermediateBalance + newBalanceChange;

      // Actualizar balance en el backend
      const balanceResponse = await fetch(
        `https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/accounts/${userId}/${formData.accountId}/balance`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ balance: newBalance })
        }
      );

      if (!balanceResponse.ok) throw new Error('Error al actualizar el balance');

      // Actualizar la transacción
      const editResponse = await fetch(
        `https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/transactions/${userId}/transactions/${editingId}`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(transactionData)
        }
      );

      if (!editResponse.ok) {
        const errorData = await editResponse.json();
        throw new Error(errorData.message || 'Error al editar la transacción');
      }

      savedTransaction = await editResponse.json();

      // Actualizar estado local
      setAccounts(prev => prev.map(a => 
        a.accountId === formData.accountId 
          ? { ...a, balance: newBalance } 
          : a
      ));
    } else {
      // Para creación nueva (mantén el código existente)
      const response = await fetch(
        `https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/transactions`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(transactionData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la transacción');
      }

      savedTransaction = await response.json();

      // Actualizar balance para nueva transacción
      const account = accounts.find(a => a.accountId === formData.accountId);
      if (!account) throw new Error('Cuenta no encontrada');

      const balanceChange = formData.transactionType === 'income' 
        ? parseFloat(formData.amount) 
        : -parseFloat(formData.amount);
      const newBalance = account.balance + balanceChange;

      const balanceResponse = await fetch(
        `https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/accounts/${userId}/${formData.accountId}/balance`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ balance: newBalance })
        }
      );

      if (!balanceResponse.ok) {
        throw new Error('Error al actualizar el balance de la cuenta');
      }

      setAccounts(prev => prev.map(a => 
        a.accountId === formData.accountId 
          ? { ...a, balance: newBalance } 
          : a
      ));
    }

    // Actualizar lista de transacciones
    if (isEditing) {
      setTransactions(prev => prev.map(t => 
        t.transactionId === editingId ? savedTransaction : t
      ));
    } else {
      setTransactions(prev => [...prev, savedTransaction]);
    }

    // Resetear formulario
    setShowForm(false);
    setEditingId(null);
    setFormData({
      accountId: '',
      categoryId: '',
      transactionType: 'expense',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      receiptUrl: ''
    });

  } catch (err) {
    console.error('Error en handleSubmit:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async (transactionId, accountId, amount, type) => {
    if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;

    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      if (!userData) throw new Error('Usuario no autenticado');
      
      const { userId, token } = JSON.parse(userData);

      // 1. Primero revertir el dinero a la cuenta
      const account = accounts.find(a => a.accountId === accountId);
      if (!account) throw new Error('Cuenta no encontrada');

      const balanceChange = type === 'income' ? -amount : amount;
      const newBalance = account.balance + balanceChange;

      // Actualizar balance en el backend
      const balanceResponse = await fetch(
        `https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/accounts/${userId}/${accountId}/balance`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ balance: newBalance })
        }
      );

      if (!balanceResponse.ok) throw new Error('Error al actualizar el balance');

      // 2. Ahora eliminar la transacción
      const deleteResponse = await fetch(
        `https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/transactions/delete/${userId}/${transactionId}`,
        { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.message || 'Error al eliminar la transacción');
      }

      // Actualizar el estado local solo si ambas operaciones tienen éxito
      setTransactions(prev => prev.filter(t => t.transactionId !== transactionId));
      setAccounts(prev => prev.map(a => 
        a.accountId === accountId ? { ...a, balance: newBalance } : a
      ));

    } catch (err) {
      console.error('Error en handleDelete:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAccountName = (accountId) => {
    return accounts.find(a => a.accountId === accountId)?.accountName || accountId;
  };

  const getCategoryName = (categoryId) => {
    return categories.find(c => c.categoryId === categoryId)?.categoryName || categoryId;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const formatAmount = (amount, type) => {
    return `${type === 'income' ? '+' : '-'}$${Math.abs(amount).toFixed(2)}`;
  };

  const resetFilters = () => {
    setFilters({
      categoryId: '',
      startDate: '',
      endDate: '',
      transactionType: ''
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Filter by category
    if (filters.categoryId && transaction.categoryId !== filters.categoryId) {
      return false;
    }
    
    // Filter by transaction type
    if (filters.transactionType && transaction.transactionType !== filters.transactionType) {
      return false;
    }
    
    // Filter by date range
    const transactionDate = new Date(transaction.date);
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      if (transactionDate < startDate) return false;
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (transactionDate > endDate) return false;
    }
    
    return true;
  });

  if (loading) return <div className={styles.container}>Cargando...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestión de Transacciones</h1>
        <div className={styles.headerButtons}>
          <button 
            className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> {showFilters ? 'Ocultar Filtros' : 'Filtrar'}
          </button>
          <button 
            className={styles.addButton}
            onClick={() => setShowForm(!showForm)}
          >
            <FiPlus /> {showForm ? 'Cancelar' : 'Nueva Transacción'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filterContainer}>
          <h3>Filtrar Transacciones</h3>
          
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Tipo de Transacción</label>
              <select
                name="transactionType"
                value={filters.transactionType}
                onChange={handleFilterChange}
              >
                <option value="">Todos los tipos</option>
                <option value="expense">Gastos</option>
                <option value="income">Ingresos</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Categoría</label>
              <select
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Desde</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Hasta</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className={styles.filterActions}>
            <button 
              className={styles.resetButton}
              onClick={resetFilters}
            >
              <FiX /> Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className={styles.formContainer}>
          <h2>{editingId ? 'Editar Transacción' : 'Nueva Transacción'}</h2>
          
          {error && (
            <div className={styles.error}>
              <FiAlertTriangle /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Tipo de Transacción</label>
              <select
                name="transactionType"
                value={formData.transactionType}
                onChange={handleInputChange}
                required
              >
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Cuenta</label>
              <select
                name="accountId"
                value={formData.accountId}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona una cuenta</option>
                {accounts.map(account => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.accountName} (${account.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Categoría</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories
                  .filter(c => c.categoryType === formData.transactionType)
                  .map(category => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.categoryName}
                    </option>
                  ))}
              </select>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Monto</label>
                <div className={styles.amountInput}>
                  <FiDollarSign />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Fecha</label>
                <div className={styles.dateInput}>
                  <FiCalendar />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Notas</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Descripción de la transacción"
              />
            </div>

            <div className={styles.formGroup}>
              <label>URL del Ticket/Factura (opcional)</label>
              <input
                type="text"
                name="receiptUrl"
                value={formData.receiptUrl}
                onChange={handleInputChange}
                placeholder="s3://mi-app-finanzas-assets/recibos/..."
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading || !formData.accountId || !formData.categoryId || !formData.amount || !formData.date}
            >
              {loading ? 'Guardando...' : 'Guardar Transacción'}
            </button>
          </form>
        </div>
      )}

      <div className={styles.transactionsList}>
        <div className={styles.transactionsHeader}>
          <h2>Historial de Transacciones</h2>
          {Object.values(filters).some(filter => filter !== '') && (
            <div className={styles.activeFilters}>
              Filtros aplicados: 
              {filters.transactionType && ` Tipo: ${filters.transactionType === 'expense' ? 'Gastos' : 'Ingresos'}`}
              {filters.categoryId && ` Categoría: ${getCategoryName(filters.categoryId)}`}
              {filters.startDate && ` Desde: ${formatDate(filters.startDate)}`}
              {filters.endDate && ` Hasta: ${formatDate(filters.endDate)}`}
            </div>
          )}
        </div>
        
        {filteredTransactions.length === 0 ? (
          <p>No hay transacciones que coincidan con los filtros</p>
        ) : (
          <div className={styles.transactionCards}>
            {filteredTransactions.map(transaction => (
              <div key={transaction.transactionId} className={styles.transactionCard}>
                <div className={styles.transactionHeader}>
                  <span className={styles.transactionDate}>{formatDate(transaction.date)}</span>
                  <span 
                    className={`${styles.transactionAmount} ${
                      transaction.transactionType === 'income' ? styles.income : styles.expense
                    }`}
                  >
                    {formatAmount(transaction.amount, transaction.transactionType)}
                  </span>
                </div>

                <div className={styles.transactionDetails}>
                  <div>
                    <strong>ID:</strong> {transaction.transactionId}
                  </div>
                  <div>
                    <strong>Cuenta:</strong> {getAccountName(transaction.accountId)}
                  </div>
                  <div>
                    <strong>Categoría:</strong> {getCategoryName(transaction.categoryId)}
                  </div>
                  {transaction.notes && (
                    <div>
                      <strong>Notas:</strong> {transaction.notes}
                    </div>
                  )}
                  {transaction.receiptUrl && (
                    <div>
                      <strong>Ticket:</strong> 
                      <a href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer">
                        Ver comprobante
                      </a>
                    </div>
                  )}
                </div>

                <div className={styles.transactionActions}>
                  <button 
                    className={styles.editButton}
                    onClick={() => handleEdit(transaction)}
                  >
                    <FiEdit /> Editar
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => handleDelete(
                      transaction.transactionId,
                      transaction.accountId,
                      transaction.amount,
                      transaction.transactionType
                    )}
                  >
                    <FiTrash2 /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}