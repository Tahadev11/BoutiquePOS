import { useEffect, useState } from 'react';
import api from '../api/api';

function Sales() {
  const [sales, setSales] = useState([]);
  const [returnExchanges, setReturnExchanges] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [salesSummary, setSalesSummary] = useState({
    grossSales: 0,
    grossCost: 0,
    grossProfit: 0,
    returnExchangeSalesAdjustment: 0,
    returnExchangeCostAdjustment: 0,
    returnExchangeProfitAdjustment: 0,
    netSales: 0,
    netCost: 0,
    netProfit: 0,
    salesCount: 0,
    returnExchangeCount: 0,
  });

  const [summaryLoading, setSummaryLoading] =
    useState(false);

  const [search, setSearch] = useState('');
  const [returnExchangeSearch, setReturnExchangeSearch] =
    useState('');

  const [loading, setLoading] = useState(false);
  const [returnExchangeLoading, setReturnExchangeLoading] =
    useState(false);

  const [expenseLoading, setExpenseLoading] =
    useState(false);

  const [message, setMessage] = useState('');
  const [returnExchangeMessage, setReturnExchangeMessage] =
    useState('');

  const [expenseMessage, setExpenseMessage] =
    useState('');

  // Summary period
  const [summaryPeriod, setSummaryPeriod] =
    useState('today');

  // Sales / Returns / Expenses section
  const [activeSection, setActiveSection] =
    useState('sales');

  // Expense form
  const [expenseAmount, setExpenseAmount] =
    useState('');

  const [expenseDate, setExpenseDate] =
    useState(
      new Date()
        .toISOString()
        .split('T')[0]
    );

  const [editingExpenseId, setEditingExpenseId] =
    useState(null);

  // Delete expense modal
  const [deleteExpenseId, setDeleteExpenseId] =
    useState(null);

  // ==========================================
  // FETCH SALES HISTORY
  // ==========================================

  const fetchSales = async () => {
    try {
      setLoading(true);
      setMessage('');

      const response =
        await api.get('/sales/history/all');

      setSales(
        Array.isArray(response.data)
          ? response.data.filter(
            (transaction) =>
              transaction.historyType === 'sale'
          )
          : []
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
        'Failed to load sales history'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH RETURN & EXCHANGE HISTORY
  // ==========================================

  const fetchReturnExchanges = async () => {
    try {
      setReturnExchangeLoading(true);
      setReturnExchangeMessage('');

      const response =
        await api.get(
          '/sales/return-exchanges/all'
        );

      setReturnExchanges(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(error);

      setReturnExchangeMessage(
        error.response?.data?.message ||
        'Failed to load return & exchange history'
      );
    } finally {
      setReturnExchangeLoading(false);
    }
  };

  // ==========================================
  // FETCH SALES SUMMARY
  // ==========================================

  const fetchSalesSummary = async () => {
    try {
      setSummaryLoading(true);

      let startDate = null;
      let endDate = new Date();

      const now = new Date();

      // ========================================
      // TODAY
      // ========================================

      if (summaryPeriod === 'today') {
        startDate = new Date(now);

        startDate.setHours(
          0,
          0,
          0,
          0
        );
      }

      // ========================================
      // LAST 7 DAYS
      // ========================================

      if (summaryPeriod === '7days') {
        startDate = new Date(now);

        startDate.setDate(
          now.getDate() - 6
        );

        startDate.setHours(
          0,
          0,
          0,
          0
        );
      }

      // ========================================
      // LAST 30 DAYS
      // ========================================

      if (summaryPeriod === '30days') {
        startDate = new Date(now);

        startDate.setDate(
          now.getDate() - 29
        );

        startDate.setHours(
          0,
          0,
          0,
          0
        );
      }

      // ========================================
      // OVERALL
      // ========================================

      if (summaryPeriod === 'overall') {
        startDate = null;
        endDate = null;
      }

      const params = {};

      if (startDate) {
        params.startDate =
          startDate.toISOString();
      }

      if (endDate) {
        params.endDate =
          endDate.toISOString();
      }

      const response =
        await api.get(
          '/sales/reports/summary',
          {
            params,
          }
        );

      setSalesSummary(
        response.data || {}
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
        'Failed to load sales summary'
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  // ==========================================
  // FETCH EXPENSES
  // ==========================================

  const fetchExpenses = async () => {
    try {
      setExpenseLoading(true);
      setExpenseMessage('');

      const response =
        await api.get('/expenses');

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
    fetchReturnExchanges();
    fetchExpenses();
  }, []);

  useEffect(() => {
    fetchSalesSummary();
  }, [summaryPeriod]);

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return '—';
    }

    return new Date(date).toLocaleString();
  };

  const formatExpenseDate = (date) => {
    if (!date) {
      return '—';
    }

    return new Date(date).toLocaleDateString();
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

    const expenseDate =
      new Date(expense.expenseDate);

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
      const startDate =
        new Date(now);

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
      const startDate =
        new Date(now);

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
  // EXPENSES FOR SUMMARY
  // ==========================================

  const summaryExpenses =
    expenses.filter(
      isExpenseInPeriod
    );

  const totalExpenses =
    summaryExpenses.reduce(
      (sum, expense) =>
        sum +
        Number(expense.amount || 0),
      0
    );

  const netAmount =
    Number(
      salesSummary.netProfit || 0
    ) - totalExpenses;

  // ==========================================
  // SALES SEARCH
  // ==========================================

  const filteredSales =
    sales.filter((transaction) => {
      const searchText =
        search
          .toLowerCase()
          .trim();

      if (!searchText) {
        return true;
      }

      const documentNumber =
        transaction.documentNumber
          ?.toLowerCase() || '';

      const itemsText =
        transaction.items
          ?.map(
            (item) =>
              item.dressName
                ?.toLowerCase() || ''
          )
          .join(' ') || '';

      return (
        documentNumber.includes(
          searchText
        ) ||
        itemsText.includes(
          searchText
        )
      );
    });

  // ==========================================
  // RETURN / EXCHANGE SEARCH
  // ==========================================

  const filteredReturnExchanges =
    returnExchanges.filter(
      (transaction) => {
        const searchText =
          returnExchangeSearch
            .toLowerCase()
            .trim();

        if (!searchText) {
          return true;
        }

        const documentNumber =
          transaction.documentNumber
            ?.toLowerCase() || '';

        const originalInvoiceNumber =
          transaction.originalInvoiceNumber
            ?.toLowerCase() || '';

        const type =
          transaction.type
            ?.toLowerCase() || '';

        const returnedItemsText =
          transaction.returnedItems
            ?.map(
              (item) =>
                item.dressName
                  ?.toLowerCase() || ''
            )
            .join(' ') || '';

        const exchangeItemsText =
          transaction.exchangeItems
            ?.map(
              (item) =>
                `${item.returnedDressName || ''} ${item.replacementDressName || ''
                  }`.toLowerCase()
            )
            .join(' ') || '';

        return (
          documentNumber.includes(
            searchText
          ) ||
          originalInvoiceNumber.includes(
            searchText
          ) ||
          type.includes(
            searchText
          ) ||
          returnedItemsText.includes(
            searchText
          ) ||
          exchangeItemsText.includes(
            searchText
          )
        );
      }
    );

  // ==========================================
  // ADD / UPDATE EXPENSE
  // ==========================================

  const handleExpenseSubmit =
    async (event) => {
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
          amount:
            Number(expenseAmount),
          expenseDate:
            expenseDate,
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

        await fetchSalesSummary();
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

  const handleEditExpense =
    (expense) => {
      setEditingExpenseId(
        expense._id
      );

      setExpenseAmount(
        expense.amount
      );

      const date =
        new Date(
          expense.expenseDate
        );

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

  const handleCancelEdit =
    () => {
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

  const handleDeleteExpense =
    async () => {
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

        setDeleteExpenseId(null);

        await fetchExpenses();

        await fetchSalesSummary();
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

  // ==========================================
  // REFRESH EVERYTHING
  // ==========================================

  const handleRefresh = () => {
    fetchSales();
    fetchReturnExchanges();
    fetchExpenses();
    fetchSalesSummary();
  };

  return (
    <div className="sales-page">

      {/* ====================================
          HEADER
      ==================================== */}

      <div className="sales-header">

        <div>

          <h2>
            Sales & Financial History
          </h2>

          <p>
            View sales, returns, exchanges
            and shop expenses
          </p>

        </div>

        <button
          type="button"
          onClick={handleRefresh}
        >
          Refresh
        </button>

      </div>

      {/* ====================================
          SECTION BUTTONS
      ==================================== */}

      <div className="sales-section-buttons">

        <button
          type="button"
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
          type="button"
          className={
            activeSection === 'returns'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveSection('returns')
          }
        >
          Return & Exchange
        </button>

        <button
          type="button"
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
          SALES SUMMARY
      ==================================== */}

      <div className="profit-summary-section">

        <div className="profit-summary-header">

          <div>

            <h3>
              Sales Summary
            </h3>

            <p>
              View actual sales performance
              and shop expenses for a
              selected period
            </p>

          </div>

        </div>

        {/* ==================================
            PERIOD BUTTONS
        ================================== */}

        <div className="summary-period-buttons">

          <button
            type="button"
            className={
              summaryPeriod === 'today'
                ? 'active'
                : ''
            }
            onClick={() =>
              setSummaryPeriod('today')
            }
          >
            Today
          </button>

          <button
            type="button"
            className={
              summaryPeriod === '7days'
                ? 'active'
                : ''
            }
            onClick={() =>
              setSummaryPeriod('7days')
            }
          >
            Last 7 Days
          </button>

          <button
            type="button"
            className={
              summaryPeriod === '30days'
                ? 'active'
                : ''
            }
            onClick={() =>
              setSummaryPeriod('30days')
            }
          >
            Last 30 Days
          </button>

          <button
            type="button"
            className={
              summaryPeriod === 'overall'
                ? 'active'
                : ''
            }
            onClick={() =>
              setSummaryPeriod('overall')
            }
          >
            Overall
          </button>

        </div>

        {/* ==================================
            SUMMARY CARDS
        ================================== */}

        <div className="sales-summary">

          <div className="sales-summary-cards">

            {/* ACTUAL SALES */}

            <div className="summary-card">

              <div className="summary-card-title">
                Actual Sales
              </div>

              <div className="summary-card-value">

                {summaryLoading
                  ? 'Loading...'
                  : `Rs. ${Number(
                    salesSummary.netSales || 0
                  ).toLocaleString()}`}

              </div>

            </div>

            {/* ACTUAL PURCHASE COST */}

            <div className="summary-card">

              <div className="summary-card-title">
                Actual Purchase Cost
              </div>

              <div className="summary-card-value">

                {summaryLoading
                  ? 'Loading...'
                  : `Rs. ${Number(
                    salesSummary.netCost || 0
                  ).toLocaleString()}`}

              </div>

            </div>

            {/* ACTUAL PROFIT */}

            <div className="summary-card">

              <div className="summary-card-title">
                Actual Profit
              </div>

              <div className="summary-card-value">

                {summaryLoading
                  ? 'Loading...'
                  : `Rs. ${Number(
                    salesSummary.netProfit || 0
                  ).toLocaleString()}`}

              </div>

            </div>

            {/* SHOP EXPENSE */}

            <div className="summary-card">

              <div className="summary-card-title">
                Shop Expense
              </div>

              <div className="summary-card-value">

                Rs.{' '}
                {Number(
                  totalExpenses || 0
                ).toLocaleString()}

              </div>

            </div>

            {/* NET AMOUNT */}

            <div className="summary-card">

              <div className="summary-card-title">
                Net Amount
              </div>

              <div className="summary-card-value">

                Rs.{' '}
                {Number(
                  netAmount || 0
                ).toLocaleString()}

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ====================================
          SALES HISTORY SECTION
      ==================================== */}

      {activeSection === 'sales' && (

        <div className="sales-history-section">

          {/* SEARCH */}

          <div className="sales-search">

            <input
              type="text"
              placeholder="Search invoice or dress name..."
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

            <p className="sales-loading">
              Loading sales history...
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
                      (transaction) => (

                        <tr
                          key={
                            transaction._id
                          }
                        >

                          {/* INVOICE */}

                          <td>

                            <strong>
                              {
                                transaction.documentNumber
                              }
                            </strong>

                          </td>

                          {/* DATE */}

                          <td>

                            {formatDate(
                              transaction.createdAt
                            )}

                          </td>

                          {/* ITEMS */}

                          <td>

                            {transaction.items
                              ?.map(
                                (
                                  item,
                                  index
                                ) => (

                                  <div
                                    className="history-item"
                                    key={index}
                                  >

                                    <span>
                                      {item.dressName}
                                    </span>

                                    <span>
                                      ×{' '}
                                      {
                                        item.quantity
                                      }
                                    </span>

                                  </div>

                                )
                              )}

                          </td>

                          {/* PAYMENT */}

                          <td>

                            {transaction
                              .paymentMethod ||
                              '—'}

                          </td>

                          {/* TOTAL */}

                          <td>

                            <strong>
                              Rs.{' '}

                              {Number(
                                transaction.amount ||
                                0
                              ).toLocaleString()}
                            </strong>

                          </td>

                          {/* PURCHASE COST */}

                          <td>

                            Rs.{' '}

                            {Number(
                              transaction.purchaseCost ||
                              0
                            ).toLocaleString()}

                          </td>

                          {/* PROFIT */}

                          <td>

                            Rs.{' '}

                            {Number(
                              transaction.profit ||
                              0
                            ).toLocaleString()}

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      )}

      {/* ====================================
          RETURN & EXCHANGE HISTORY
      ==================================== */}

      {activeSection === 'returns' && (

        <div className="return-exchange-history-section">

          {/* HEADER */}

          <div className="return-exchange-history-header">

            <div>

              <h3>
                Return & Exchange History
              </h3>

              <p>
                View all returned and exchanged
                transactions
              </p>

            </div>

          </div>

          {/* SEARCH */}

          <div className="sales-search">

            <input
              type="text"
              placeholder="Search return, exchange, invoice or dress name..."
              value={returnExchangeSearch}
              onChange={(e) =>
                setReturnExchangeSearch(
                  e.target.value
                )
              }
            />

            {returnExchangeSearch && (

              <button
                type="button"
                onClick={() =>
                  setReturnExchangeSearch('')
                }
              >
                Clear
              </button>

            )}

          </div>

          {/* MESSAGE */}

          {returnExchangeMessage && (

            <p className="sales-message">
              {returnExchangeMessage}
            </p>

          )}

          {/* TABLE */}

          {returnExchangeLoading ? (

            <p className="sales-loading">
              Loading return & exchange history...
            </p>

          ) : (

            <div className="sales-table-container">

              <table className="sales-table return-exchange-table">

                <thead>

                  <tr>

                    <th>
                      Document
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Original Invoice
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
                      Return Amount
                    </th>

                    <th>
                      Exchange Amount
                    </th>

                    <th>
                      Refund
                    </th>

                    <th>
                      Additional Payment
                    </th>

                    <th>
                      Net Amount
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredReturnExchanges.length === 0 ? (

                    <tr>

                      <td colSpan="11">

                        {returnExchangeSearch
                          ? 'No matching return or exchange found'
                          : 'No returns or exchanges found'}

                      </td>

                    </tr>

                  ) : (

                    filteredReturnExchanges.map(
                      (transaction) => {

                        const isReturn =
                          transaction.type ===
                          'return';

                        const isExchange =
                          transaction.type ===
                          'exchange';

                        return (

                          <tr
                            key={
                              transaction._id
                            }
                          >

                            {/* DOCUMENT */}

                            <td>

                              <strong>
                                {
                                  transaction.documentNumber
                                }
                              </strong>

                            </td>

                            {/* TYPE */}

                            <td>

                              <span
                                className={
                                  isReturn
                                    ? 'transaction-type return-type'
                                    : isExchange
                                      ? 'transaction-type exchange-type'
                                      : 'transaction-type'
                                }
                              >

                                {isReturn
                                  ? 'Return'
                                  : isExchange
                                    ? 'Exchange'
                                    : transaction.type}

                              </span>

                            </td>

                            {/* ORIGINAL INVOICE */}

                            <td>

                              <strong>
                                {
                                  transaction.originalInvoiceNumber ||
                                  '—'
                                }
                              </strong>

                            </td>

                            {/* DATE */}

                            <td>

                              {formatDate(
                                transaction.createdAt
                              )}

                            </td>

                            {/* ITEMS */}

                            <td>

                              {/* COMPLETE RETURN ITEMS */}

                              {transaction.returnedItems
                                ?.map(
                                  (
                                    item,
                                    index
                                  ) => (

                                    <div
                                      className="return-exchange-item"
                                      key={`return-${index}`}
                                    >

                                      <span className="return-item-label">
                                        Return
                                      </span>

                                      <span>
                                        {item.dressName}
                                      </span>

                                      <span>
                                        ×{' '}
                                        {
                                          item.quantity
                                        }
                                      </span>

                                    </div>

                                  )
                                )}

                              {/* EXCHANGE ITEMS */}

                              {/* EXCHANGE ITEMS */}

                              {transaction.exchangeItems?.map((item, index) => (
                                <div
                                  className="return-exchange-item exchange-item-row"
                                  key={`exchange-${index}`}
                                >
                                  <span className="exchange-item-label">
                                    Exchange
                                  </span>

                                  {/* RETURNED DRESS */}

                                  <span className="exchange-dress-name">
                                    {item.returnedDressName}
                                    <strong>
                                      {' '}× {item.returnedQuantity}
                                    </strong>
                                  </span>

                                  <span className="exchange-arrow">
                                    →
                                  </span>

                                  {/* REPLACEMENT DRESSES */}

                                  <div className="replacement-items-list">
                                    {item.replacementItems?.map(
                                      (replacement, replacementIndex) => (
                                        <span
                                          className="exchange-dress-name replacement-dress"
                                          key={
                                            replacement.product ||
                                            replacementIndex
                                          }
                                        >
                                          {replacement.dressName}
                                          <strong>
                                            {' '}× {replacement.quantity}
                                          </strong>

                                          {replacementIndex <
                                            item.replacementItems.length - 1 && (
                                              <span className="replacement-plus">
                                                {' + '}
                                              </span>
                                            )}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              ))}
                            </td>

                            {/* PAYMENT */}

                            <td>

                              {transaction
                                .paymentMethod ||
                                '—'}

                            </td>

                            {/* RETURN AMOUNT */}

                            <td>

                              Rs.{' '}

                              {Number(
                                transaction.returnAmount ||
                                0
                              ).toLocaleString()}

                            </td>

                            {/* EXCHANGE AMOUNT */}

                            <td>

                              Rs.{' '}

                              {Number(
                                transaction.exchangeAmount ||
                                0
                              ).toLocaleString()}

                            </td>

                            {/* REFUND */}

                            <td>

                              <span className="refund-amount">

                                Rs.{' '}

                                {Number(
                                  transaction.refundAmount ||
                                  0
                                ).toLocaleString()}

                              </span>

                            </td>

                            {/* ADDITIONAL PAYMENT */}

                            <td>

                              <span className="additional-payment">

                                Rs.{' '}

                                {Number(
                                  transaction.additionalPayment ||
                                  0
                                ).toLocaleString()}

                              </span>

                            </td>

                            {/* NET AMOUNT */}

                            <td>

                              <strong
                                className={
                                  Number(
                                    transaction.netAmount ||
                                    0
                                  ) < 0
                                    ? 'negative-amount'
                                    : Number(
                                      transaction.netAmount ||
                                      0
                                    ) > 0
                                      ? 'positive-amount'
                                      : ''
                                }
                              >

                                Rs.{' '}

                                {Number(
                                  transaction.netAmount ||
                                  0
                                ).toLocaleString()}

                              </strong>

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

        </div>

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

              <p className="sales-loading">
                Loading expenses...
              </p>

            ) : expenses.length === 0 ? (

              <p className="empty-expense-message">
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
                          key={
                            expense._id
                          }
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
                            ).toLocaleString()}
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