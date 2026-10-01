import { useEffect, useState } from 'react';
import api from '../api/api';

function Sales() {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [expenseMessage, setExpenseMessage] = useState('');

  // Summary period
  const [summaryPeriod, setSummaryPeriod] = useState('today');

  // Sales / Expense section
  const [activeSection, setActiveSection] = useState('sales');

  // Expense form
  const [expenseAmount, setExpenseAmount] = useState('');

  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // Delete expense modal
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);

  // ==========================================
  // FETCH SALES
  // ==========================================

  const fetchSales = async () => {
    try {
      setLoading(true);
      setMessage('');

      const response = await api.get('/sales');

      setSales(response.data);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Failed to load sales'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH EXPENSES
  // ==========================================

  const fetchExpenses = async () => {
    try {
      setExpenseLoading(true);
      setExpenseMessage('');

      const response = await api.get('/expenses');

      setExpenses(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(error);

      setExpenseMessage(
        error.response?.data?.message ||
          'Failed to load shop expenses'
      );
    } finally {
      setExpenseLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchSales();
    fetchExpenses();
  }, []);

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatExpenseDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // ==========================================
  // CALCULATE PURCHASE COST
  // ==========================================

  const calculatePurchaseCost = (sale) => {
    return (
      sale.items?.reduce((total, item) => {
        const purchasePrice =
          Number(item.purchasePrice) || 0;

        const quantity =
          Number(item.quantity) || 0;

        return (
          total +
          purchasePrice * quantity
        );
      }, 0) || 0
    );
  };

  // ==========================================
  // CALCULATE PROFIT
  // ==========================================

  const calculateProfit = (sale) => {
    return (
      sale.items?.reduce((total, item) => {
        const profit =
          Number(item.profit) || 0;

        return total + profit;
      }, 0) || 0
    );
  };

  // ==========================================
  // CHECK SALE PERIOD
  // ==========================================

  const isSaleInPeriod = (sale) => {
    if (!sale.createdAt) {
      return false;
    }

    // Overall = all sales
    if (summaryPeriod === 'overall') {
      return true;
    }

    const saleDate = new Date(sale.createdAt);
    const now = new Date();

    // ========================================
    // TODAY
    // ========================================

    if (summaryPeriod === 'today') {
      return (
        saleDate.getFullYear() ===
          now.getFullYear() &&
        saleDate.getMonth() ===
          now.getMonth() &&
        saleDate.getDate() ===
          now.getDate()
      );
    }

    // ========================================
    // LAST 7 DAYS
    // ========================================

    if (summaryPeriod === '7days') {
      const startDate = new Date(now);

      startDate.setDate(
        now.getDate() - 6
      );

      startDate.setHours(
        0,
        0,
        0,
        0
      );

      return (
        saleDate >= startDate &&
        saleDate <= now
      );
    }

    // ========================================
    // LAST 30 DAYS
    // ========================================

    if (summaryPeriod === '30days') {
      const startDate = new Date(now);

      startDate.setDate(
        now.getDate() - 29
      );

      startDate.setHours(
        0,
        0,
        0,
        0
      );

      return (
        saleDate >= startDate &&
        saleDate <= now
      );
    }

    return false;
  };

  // ==========================================
  // CHECK EXPENSE PERIOD
  // ==========================================

  const isExpenseInPeriod = (expense) => {
    if (!expense.expenseDate) {
      return false;
    }

    // Overall = all expenses
    if (summaryPeriod === 'overall') {
      return true;
    }

    const expenseDate = new Date(
      expense.expenseDate
    );

    const now = new Date();

    // ========================================
    // TODAY
    // ========================================

    if (summaryPeriod === 'today') {
      return (
        expenseDate.getFullYear() ===
          now.getFullYear() &&
        expenseDate.getMonth() ===
          now.getMonth() &&
        expenseDate.getDate() ===
          now.getDate()
      );
    }

    // ========================================
    // LAST 7 DAYS
    // ========================================

    if (summaryPeriod === '7days') {
      const startDate = new Date(now);

      startDate.setDate(
        now.getDate() - 6
      );

      startDate.setHours(
        0,
        0,
        0,
        0
      );

      return (
        expenseDate >= startDate &&
        expenseDate <= now
      );
    }

    // ========================================
    // LAST 30 DAYS
    // ========================================

    if (summaryPeriod === '30days') {
      const startDate = new Date(now);

      startDate.setDate(
        now.getDate() - 29
      );

      startDate.setHours(
        0,
        0,
        0,
        0
      );

      return (
        expenseDate >= startDate &&
        expenseDate <= now
      );
    }

    return false;
  };

  // ==========================================
  // SALES FOR SUMMARY
  // ==========================================

  const summarySales = sales.filter(
    isSaleInPeriod
  );

  // ==========================================
  // EXPENSES FOR SUMMARY
  // ==========================================

  const summaryExpenses =
    expenses.filter(
      isExpenseInPeriod
    );

  // ==========================================
  // TOTAL SALES
  // ==========================================

  const totalSales = summarySales.reduce(
    (total, sale) => {
      return (
        total +
        (Number(sale.totalAmount) || 0)
      );
    },
    0,
  );

  // ==========================================
  // TOTAL PURCHASE COST
  // ==========================================

  const totalPurchaseCost =
    summarySales.reduce(
      (total, sale) => {
        return (
          total +
          calculatePurchaseCost(sale)
        );
      },
      0,
    );

  // ==========================================
  // TOTAL PROFIT
  // ==========================================

  const totalProfit =
    summarySales.reduce(
      (total, sale) => {
        return (
          total +
          calculateProfit(sale)
        );
      },
      0,
    );

  // ==========================================
  // TOTAL SHOP EXPENSE
  // ==========================================

  const totalExpenses =
    summaryExpenses.reduce(
      (total, expense) => {
        return (
          total +
          (Number(expense.amount) || 0)
        );
      },
      0,
    );

  // ==========================================
  // NET AMOUNT
  // ==========================================

  const netAmount =
    totalProfit - totalExpenses;

  // ==========================================
  // SEARCH / SALES HISTORY
  // ==========================================

  const filteredSales = sales.filter(
    (sale) => {
      const searchText =
        search.toLowerCase().trim();

      if (!searchText) {
        return true;
      }

      const invoiceNumber =
        sale.invoiceNumber?.toLowerCase() ||
        '';

      const dressNames =
        sale.items
          ?.map(
            (item) =>
              item.dressName?.toLowerCase() ||
              '',
          )
          .join(' ') || '';

      return (
        invoiceNumber.includes(
          searchText
        ) ||
        dressNames.includes(
          searchText
        )
      );
    },
  );

  // ==========================================
  // ADD / UPDATE EXPENSE
  // ==========================================

  const handleExpenseSubmit = async (
    event
  ) => {
    event.preventDefault();

    setExpenseMessage('');

    if (!expenseAmount) {
      setExpenseMessage(
        'Please enter expense amount'
      );
      return;
    }

    if (
      Number(expenseAmount) <= 0
    ) {
      setExpenseMessage(
        'Expense amount must be greater than 0'
      );
      return;
    }

    if (!expenseDate) {
      setExpenseMessage(
        'Please select expense date'
      );
      return;
    }

    try {
      setExpenseLoading(true);

      const expenseData = {
        amount: Number(expenseAmount),
        expenseDate: expenseDate,
      };

      if (editingExpenseId) {
        await api.patch(
          `/expenses/${editingExpenseId}`,
          expenseData
        );

        setExpenseMessage(
          'Shop expense updated successfully'
        );
      } else {
        await api.post(
          '/expenses',
          expenseData
        );

        setExpenseMessage(
          'Shop expense added successfully'
        );
      }

      setExpenseAmount('');

      setExpenseDate(
        new Date()
          .toISOString()
          .split('T')[0]
      );

      setEditingExpenseId(null);

      await fetchExpenses();
    } catch (error) {
      console.error(error);

      setExpenseMessage(
        error.response?.data?.message ||
          'Failed to save shop expense'
      );
    } finally {
      setExpenseLoading(false);
    }
  };

  // ==========================================
  // EDIT EXPENSE
  // ==========================================

  const handleEditExpense = (
    expense
  ) => {
    setEditingExpenseId(
      expense._id
    );

    setExpenseAmount(
      expense.amount
    );

    const date =
      new Date(expense.expenseDate);

    const formattedDate =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;

    setExpenseDate(
      formattedDate
    );

    setExpenseMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setExpenseAmount('');

    setExpenseDate(
      new Date()
        .toISOString()
        .split('T')[0]
    );

    setExpenseMessage('');
  };

  // ==========================================
  // DELETE EXPENSE
  // ==========================================

  const handleDeleteExpense = async () => {
    if (!deleteExpenseId) {
      return;
    }

    try {
      setExpenseLoading(true);
      setExpenseMessage('');

      await api.delete(
        `/expenses/${deleteExpenseId}`
      );

      setExpenseMessage(
        'Shop expense deleted successfully'
      );

      // Close custom modal
      setDeleteExpenseId(null);

      await fetchExpenses();
    } catch (error) {
      console.error(error);

      setExpenseMessage(
        error.response?.data?.message ||
          'Failed to delete shop expense'
      );
    } finally {
      setExpenseLoading(false);
    }
  };

  return (
    <div className="sales-page">

      {/* ====================================
          HEADER
      ==================================== */}

      <div className="sales-header">

        <div>

          <h2>
            Sales History
          </h2>

          <p>
            View sales and manage shop expenses
          </p>

        </div>

        <button
          onClick={() => {
            fetchSales();
            fetchExpenses();
          }}
        >
          Refresh
        </button>

      </div>


      {/* ====================================
          SECTION BUTTONS
      ==================================== */}

      <div className="sales-section-buttons">

        <button
          className={
            activeSection === 'sales'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveSection('sales')
          }
        >
          Sales History
        </button>

        <button
          className={
            activeSection === 'expenses'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveSection('expenses')
          }
        >
          Shop Expenses
        </button>

      </div>


      {/* ====================================
          PROFIT SUMMARY
      ==================================== */}

      <div className="profit-summary-section">

        <div className="profit-summary-header">

          <div>

            <h3>
              Sales Summary
            </h3>

            <p>
              View sales performance
              and shop expenses
              for a selected period
            </p>

          </div>

        </div>


        {/* ==================================
            PERIOD BUTTONS
        ================================== */}

        <div className="summary-period-buttons">

          <button
            className={
              summaryPeriod === 'today'
                ? 'active'
                : ''
            }
            onClick={() =>
              setSummaryPeriod(
                'today'
              )
            }
          >
            Today
          </button>


          <button
            className={
              summaryPeriod === '7days'
                ? 'active'
                : ''
            }
            onClick={() =>
              setSummaryPeriod(
                '7days'
              )
            }
          >
            Last 7 Days
          </button>


          <button
            className={
              summaryPeriod === '30days'
                ? 'active'
                : ''
            }
            onClick={() =>
              setSummaryPeriod(
                '30days'
              )
            }
          >
            Last 30 Days
          </button>


          <button
            className={
              summaryPeriod === 'overall'
                ? 'active'
                : ''
            }
            onClick={() =>
              setSummaryPeriod(
                'overall'
              )
            }
          >
            Overall
          </button>

        </div>


        {/* ==================================
            SUMMARY CARDS
        ================================== */}

        <div className="sales-summary">

          {/* SALES */}

          <div className="sales-summary-card">

            <span>
              Sales
            </span>

            <strong>
              Rs. {totalSales}
            </strong>

          </div>


          {/* PURCHASE COST */}

          <div className="sales-summary-card">

            <span>
              Purchase Cost
            </span>

            <strong>
              Rs. {totalPurchaseCost}
            </strong>

          </div>


          {/* PROFIT */}

          <div className="sales-summary-card">

            <span>
              Profit
            </span>

            <strong>
              Rs. {totalProfit}
            </strong>

          </div>


          {/* SHOP EXPENSE */}

          <div className="sales-summary-card">

            <span>
              Shop Expense
            </span>

            <strong>
              Rs. {totalExpenses}
            </strong>

          </div>


          {/* NET AMOUNT */}

          <div className="sales-summary-card">

            <span>
              Net Amount
            </span>

            <strong>
              Rs. {netAmount}
            </strong>

          </div>

        </div>

      </div>


      {/* ====================================
          SALES HISTORY SECTION
      ==================================== */}

      {activeSection === 'sales' && (

        <>

          {/* SEARCH */}

          <div className="sales-search">

            <input
              type="text"
              placeholder="Search invoice number or dress name..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (

              <button
                type="button"
                onClick={() =>
                  setSearch('')
                }
              >
                Clear
              </button>

            )}

          </div>


          {/* MESSAGE */}

          {message && (

            <p className="sales-message">
              {message}
            </p>

          )}


          {/* SALES HISTORY */}

          {loading ? (

            <p>
              Loading sales...
            </p>

          ) : (

            <div className="sales-table-container">

              <table className="sales-table">

                <thead>

                  <tr>

                    <th>
                      Invoice
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Items
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Total
                    </th>

                    <th>
                      Purchase Cost
                    </th>

                    <th>
                      Profit
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredSales.length === 0 ? (

                    <tr>

                      <td colSpan="7">

                        {search
                          ? 'No matching sales found'
                          : 'No sales found'}

                      </td>

                    </tr>

                  ) : (

                    filteredSales.map(
                      (sale) => {

                        const purchaseCost =
                          calculatePurchaseCost(
                            sale
                          );

                        const profit =
                          calculateProfit(
                            sale
                          );

                        return (

                          <tr
                            key={sale._id}
                          >

                            <td>
                              {sale.invoiceNumber}
                            </td>


                            <td>
                              {formatDate(
                                sale.createdAt
                              )}
                            </td>


                            <td>

                              {sale.items.map(
                                (
                                  item,
                                  index
                                ) => (

                                  <div
                                    key={index}
                                  >
                                    {item.dressName}
                                    {' × '}
                                    {item.quantity}
                                  </div>

                                )
                              )}

                            </td>


                            <td>
                              {sale.paymentMethod}
                            </td>


                            <td>
                              Rs.{' '}
                              {sale.totalAmount}
                            </td>


                            <td>
                              Rs.{' '}
                              {purchaseCost}
                            </td>


                            <td>
                              Rs.{' '}
                              {profit}
                            </td>

                          </tr>

                        );
                      }
                    )

                  )}

                </tbody>

              </table>

            </div>

          )}

        </>

      )}


      {/* ====================================
          SHOP EXPENSE SECTION
      ==================================== */}

      {activeSection === 'expenses' && (

        <div className="shop-expenses-section">

          {/* EXPENSE FORM */}

          <div className="expense-form-card">

            <div className="expense-form-header">

              <div>

                <h3>
                  {editingExpenseId
                    ? 'Edit Shop Expense'
                    : 'Add Shop Expense'}
                </h3>

                <p>
                  Enter today's shop expense
                </p>

              </div>

            </div>


            <form
              onSubmit={
                handleExpenseSubmit
              }
              className="expense-form"
            >

              <div className="expense-form-field">

                <label>
                  Expense Amount
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={expenseAmount}
                  onChange={(e) =>
                    setExpenseAmount(
                      e.target.value
                    )
                  }
                />

              </div>


              <div className="expense-form-field">

                <label>
                  Expense Date
                </label>

                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) =>
                    setExpenseDate(
                      e.target.value
                    )
                  }
                />

              </div>


              <div className="expense-form-actions">

                <button
                  type="submit"
                  disabled={
                    expenseLoading
                  }
                >
                  {expenseLoading
                    ? 'Saving...'
                    : editingExpenseId
                    ? 'Update Expense'
                    : 'Add Expense'}
                </button>


                {editingExpenseId && (

                  <button
                    type="button"
                    onClick={
                      handleCancelEdit
                    }
                  >
                    Cancel
                  </button>

                )}

              </div>

            </form>


            {expenseMessage && (

              <p className="expense-message">
                {expenseMessage}
              </p>

            )}

          </div>


          {/* EXPENSE HISTORY */}

          <div className="expense-history-card">

            <div className="expense-history-header">

              <div>

                <h3>
                  Shop Expense History
                </h3>

                <p>
                  All recorded shop expenses
                </p>

              </div>

            </div>


            {expenseLoading ? (

              <p>
                Loading expenses...
              </p>

            ) : expenses.length === 0 ? (

              <p>
                No shop expenses found
              </p>

            ) : (

              <div className="expense-table-container">

                <table className="expense-table">

                  <thead>

                    <tr>

                      <th>
                        Date
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {expenses.map(
                      (expense) => (

                        <tr
                          key={expense._id}
                        >

                          <td>
                            {formatExpenseDate(
                              expense.expenseDate
                            )}
                          </td>


                          <td>
                            Rs.{' '}
                            {Number(
                              expense.amount
                            )}
                          </td>


                          <td>

                            <div className="expense-actions">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEditExpense(
                                    expense
                                  )
                                }
                              >
                                Edit
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteExpenseId(
                                    expense._id
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      )}


      {/* ====================================
          DELETE EXPENSE MODAL
      ==================================== */}

      {deleteExpenseId && (

        <div
          className="expense-modal-overlay"
          onClick={() =>
            setDeleteExpenseId(null)
          }
        >

          <div
            className="expense-delete-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="expense-modal-icon">
              !
            </div>

            <h3>
              Delete Shop Expense?
            </h3>

            <p>
              Are you sure you want to delete
              this shop expense?
            </p>

            <div className="expense-modal-actions">

              <button
                type="button"
                className="expense-modal-cancel"
                onClick={() =>
                  setDeleteExpenseId(null)
                }
                disabled={expenseLoading}
              >
                Cancel
              </button>


              <button
                type="button"
                className="expense-modal-delete"
                onClick={
                  handleDeleteExpense
                }
                disabled={expenseLoading}
              >
                {expenseLoading
                  ? 'Deleting...'
                  : 'Delete'}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Sales;