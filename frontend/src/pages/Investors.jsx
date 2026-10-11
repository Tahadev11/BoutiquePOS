import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';

function Investors() {
  // =========================================================
  // STATE
  // =========================================================

  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Investor Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Current date/time display
  const [currentDateTime, setCurrentDateTime] =
    useState(new Date());

  // Add investor
  const [showAddForm, setShowAddForm] = useState(false);

  const [investorForm, setInvestorForm] = useState({
    name: '',
    location: '',
    openingBalance: '',
  });

  // Edit investor
  const [editingInvestor, setEditingInvestor] =
    useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
  });

  // Ledger
  const [selectedInvestor, setSelectedInvestor] =
    useState(null);

  const [ledgerTransactions, setLedgerTransactions] =
    useState([]);

  const [ledgerBalance, setLedgerBalance] =
    useState(null);

  const [ledgerLoading, setLedgerLoading] =
    useState(false);

  const [showLedger, setShowLedger] =
    useState(false);

  // Transaction details
  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const [showTransactionDetails, setShowTransactionDetails] =
    useState(false);

  // Investment (money in — replaces Purchase)
  const [showInvestmentModal, setShowInvestmentModal] =
    useState(false);

  const [investmentInvestor, setInvestmentInvestor] =
    useState(null);

  const [investmentForm, setInvestmentForm] = useState({
    amount: '',
    note: '',
  });

  const [investmentLoading, setInvestmentLoading] =
    useState(false);

  // Return (money out — replaces Payment)
  const [showReturnModal, setShowReturnModal] =
    useState(false);

  const [returnInvestor, setReturnInvestor] =
    useState(null);

  const [returnForm, setReturnForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    note: '',
  });

  const [returnLoading, setReturnLoading] =
    useState(false);

  // =========================================================
  // CURRENT DATE / TIME
  // =========================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // =========================================================
  // FETCH INVESTORS
  // =========================================================

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      setMessage('');

      const response = await api.get('/investors');

      const investorData = response.data || [];

      setInvestors(investorData);

      return investorData;
    } catch (error) {
      console.error(
        'Error fetching investors:',
        error,
      );

      console.error(
        'Backend response:',
        error.response?.data,
      );

      const backendMessage =
        error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage ||
          'Failed to load investors',
      );

      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  // =========================================================
  // FILTERED INVESTORS & TOTAL BALANCE COMPUTATION
  // =========================================================

  const filteredInvestors = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return investors;

    return investors.filter(
      (investor) =>
        investor.name?.toLowerCase().includes(term) ||
        investor.location?.toLowerCase().includes(term)
    );
  }, [investors, searchTerm]);

  const totalBalance = useMemo(() => {
    return filteredInvestors.reduce(
      (acc, investor) => acc + Number(investor.balance ?? 0),
      0
    );
  }, [filteredInvestors]);

  // =========================================================
  // FORMATTING
  // =========================================================

  const formatAmount = (amount) => {
    const value = Number(amount ?? 0);

    return `Rs. ${Number.isFinite(value)
      ? Math.abs(value).toLocaleString('en-PK')
      : '0'
      }`;
  };

  const formatDate = (date) => {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleDateString(
      'en-PK',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    );
  };

  const formatDateTime = (date) => {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleString(
      'en-PK',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  };

  // =========================================================
  // INVESTOR BALANCE STATUS
  // =========================================================
  //
  // Positive = amount the boutique owes the investor.
  // Negative = over-return (investor owes boutique).
  // Zero     = settled.
  //
  // We reuse the 'advance' CSS class from the supplier
  // stylesheet for the negative state, but label it
  // "Over-Return" so the meaning is correct for investors.
  // =========================================================

  const getBalanceStatus = (balance) => {
    const amount = Number(balance ?? 0);

    if (amount > 0) {
      return {
        type: 'payable',
        label: 'Payable',
        amount,
      };
    }

    if (amount < 0) {
      return {
        type: 'advance',
        label: 'Over-Return',
        amount: Math.abs(amount),
      };
    }

    return {
      type: 'settled',
      label: 'Settled',
      amount: 0,
    };
  };

  const formatBalance = (balance) => {
    const status = getBalanceStatus(balance);

    return formatAmount(status.amount);
  };

  // =========================================================
  // ADD INVESTOR
  // =========================================================

  const handleInvestorFormChange = (e) => {
    const { name, value } = e.target;

    setInvestorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddInvestor = async (e) => {
    e.preventDefault();

    if (!investorForm.name.trim()) {
      setMessage('Investor name is required');
      return;
    }

    if (investorForm.openingBalance !== '') {
      const openingBalance = Number(
        investorForm.openingBalance,
      );

      if (
        !Number.isFinite(openingBalance) ||
        openingBalance < 0
      ) {
        setMessage(
          'Opening balance must be 0 or greater',
        );
        return;
      }
    }

    try {
      setLoading(true);
      setMessage('');

      const payload = {
        name: investorForm.name.trim(),
        location: investorForm.location.trim(),
      };

      if (
        investorForm.openingBalance !== '' &&
        investorForm.openingBalance !== null
      ) {
        payload.balance = Number(
          investorForm.openingBalance,
        );
      }

      await api.post('/investors', payload);

      setMessage('Investor added successfully');

      setInvestorForm({
        name: '',
        location: '',
        openingBalance: '',
      });

      setShowAddForm(false);

      await fetchInvestors();
    } catch (error) {
      console.error('Error adding investor:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to add investor',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // EDIT INVESTOR
  // =========================================================

  const openEditInvestor = (investor) => {
    setEditingInvestor(investor);

    setEditForm({
      name: investor.name || '',
      location: investor.location || '',
    });

    setMessage('');
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateInvestor = async (e) => {
    e.preventDefault();

    if (!editForm.name.trim()) {
      setMessage('Investor name is required');
      return;
    }

    if (!editingInvestor) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await api.patch(
        `/investors/${editingInvestor._id}`,
        {
          name: editForm.name.trim(),
          location: editForm.location.trim(),
        },
      );

      setMessage('Investor updated successfully');
      setEditingInvestor(null);

      await fetchInvestors();
    } catch (error) {
      console.error('Error updating investor:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to update investor',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // ACTIVATE / DEACTIVATE INVESTOR
  // =========================================================

  const handleToggleInvestor = async (investor) => {
    try {
      setLoading(true);
      setMessage('');

      await api.patch(
        `/investors/${investor._id}`,
        {
          isActive: !investor.isActive,
        },
      );

      setMessage(
        investor.isActive
          ? 'Investor deactivated successfully'
          : 'Investor activated successfully',
      );

      await fetchInvestors();
    } catch (error) {
      console.error('Error updating investor status:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to update investor status',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // DELETE INVESTOR
  // =========================================================

  const handleDeleteInvestor = async (investor) => {
    const balance = Number(investor.balance ?? 0);

    if (balance !== 0) {
      setMessage(
        balance > 0
          ? 'Investor cannot be deleted while a payable balance exists. Clear the balance first.'
          : 'Investor cannot be deleted while an over-return exists. Settle the balance first.',
      );
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${investor.name}?`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await api.delete(`/investors/${investor._id}`);

      setMessage('Investor deleted successfully');

      await fetchInvestors();
    } catch (error) {
      console.error('Error deleting investor:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to delete investor',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LEDGER
  // =========================================================

  const openLedger = async (investor) => {
    setSelectedInvestor(investor);
    setShowLedger(true);
    setLedgerLoading(true);
    setLedgerTransactions([]);
    setLedgerBalance(null);
    setMessage('');

    try {
      const response = await api.get(
        `/investors/${investor._id}/ledger`,
      );

      const investorData = response.data?.investor;

      const currentBalance =
        response.data?.currentBalance ??
        investorData?.balance ??
        investor.balance ??
        0;

      setLedgerTransactions(
        response.data?.transactions || [],
      );

      setLedgerBalance(currentBalance);

      if (investorData) {
        setSelectedInvestor(investorData);
      }
    } catch (error) {
      console.error('Error fetching investor ledger:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to load investor ledger',
      );
    } finally {
      setLedgerLoading(false);
    }
  };

  const closeLedger = () => {
    setShowLedger(false);
    setSelectedInvestor(null);
    setLedgerTransactions([]);
    setLedgerBalance(null);
  };

  // =========================================================
  // TRANSACTION DETAILS
  // =========================================================

  const openTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const closeTransactionDetails = () => {
    setShowTransactionDetails(false);
    setSelectedTransaction(null);
  };

  // =========================================================
  // INVESTMENT MODAL  (money in — direct amount, no dresses)
  // =========================================================

  const openInvestmentModal = (investor) => {
    setInvestmentInvestor(investor);

    setInvestmentForm({
      amount: '',
      note: '',
    });

    setCurrentDateTime(new Date());
    setShowInvestmentModal(true);
    setMessage('');
  };

  const closeInvestmentModal = () => {
    setShowInvestmentModal(false);
    setInvestmentInvestor(null);

    setInvestmentForm({
      amount: '',
      note: '',
    });
  };

  const handleInvestmentFormChange = (e) => {
    const { name, value } = e.target;

    setInvestmentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateInvestment = async (e) => {
    e.preventDefault();

    if (!investmentInvestor) {
      return;
    }

    const amount = Number(investmentForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Investment amount must be greater than 0');
      return;
    }

    try {
      setInvestmentLoading(true);
      setMessage('');

      const payload = { amount };

      if (investmentForm.note.trim()) {
        payload.note = investmentForm.note.trim();
      }

      await api.post(
        `/investors/${investmentInvestor._id}/investments`,
        payload,
      );

      closeInvestmentModal();

      await fetchInvestors();

      if (
        selectedInvestor &&
        selectedInvestor._id === investmentInvestor._id
      ) {
        const freshInvestor = await api.get(
          `/investors/${investmentInvestor._id}`,
        );

        await openLedger(freshInvestor.data);
      }

      setMessage('Investment recorded successfully');
    } catch (error) {
      console.error('Error creating investment:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to record investment',
      );
    } finally {
      setInvestmentLoading(false);
    }
  };

  // =========================================================
  // RETURN MODAL  (money out — mirrors Payment)
  // =========================================================

  const openReturnModal = (investor) => {
    setReturnInvestor(investor);

    setReturnForm({
      amount: '',
      paymentMethod: 'cash',
      note: '',
    });

    setCurrentDateTime(new Date());
    setShowReturnModal(true);
    setMessage('');
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setReturnInvestor(null);

    setReturnForm({
      amount: '',
      paymentMethod: 'cash',
      note: '',
    });
  };

  const handleReturnFormChange = (e) => {
    const { name, value } = e.target;

    setReturnForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateReturn = async (e) => {
    e.preventDefault();

    if (!returnInvestor) {
      return;
    }

    const amount = Number(returnForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Return amount must be greater than 0');
      return;
    }

    try {
      setReturnLoading(true);
      setMessage('');

      const payload = {
        amount,
        paymentMethod: returnForm.paymentMethod,
      };

      if (returnForm.note.trim()) {
        payload.note = returnForm.note.trim();
      }

      await api.post(
        `/investors/${returnInvestor._id}/returns`,
        payload,
      );

      closeReturnModal();

      await fetchInvestors();

      if (
        selectedInvestor &&
        selectedInvestor._id === returnInvestor._id
      ) {
        const freshInvestor = await api.get(
          `/investors/${returnInvestor._id}`,
        );

        await openLedger(freshInvestor.data);
      }

      setMessage('Return recorded successfully');
    } catch (error) {
      console.error('Error creating return:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to record return',
      );
    } finally {
      setReturnLoading(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="suppliers-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="suppliers-header">
        <div>
          <h1>Investors</h1>

          <p>
            Manage investors, their investments, returns
            and investor ledgers.
          </p>
        </div>

        <button
          className="add-supplier-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Close' : '+ Add Investor'}
        </button>
      </div>

      {/* =====================================================
          MESSAGE
      ====================================================== */}

      {message && (
        <div className="supplier-message">
          {message}
        </div>
      )}

      {/* =====================================================
          ADD INVESTOR
      ====================================================== */}

      {showAddForm && (
        <div className="supplier-form-card">
          <div className="supplier-form-header">
            <h2>Add Investor</h2>
          </div>

          <form onSubmit={handleAddInvestor}>
            <div className="supplier-form-grid">

              <div className="form-group">
                <label>Investor Name</label>

                <input
                  type="text"
                  name="name"
                  value={investorForm.name}
                  onChange={handleInvestorFormChange}
                  placeholder="Enter investor name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Location / Address</label>

                <input
                  type="text"
                  name="location"
                  value={investorForm.location}
                  onChange={handleInvestorFormChange}
                  placeholder="Enter investor location"
                />
              </div>

              <div className="form-group">
                <label>Opening Balance</label>

                <input
                  type="number"
                  name="openingBalance"
                  value={investorForm.openingBalance}
                  onChange={handleInvestorFormChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />

                <small>
                  Optional. This is the amount the boutique
                  already owed the investor before system start.
                </small>
              </div>

            </div>

            <div className="supplier-form-actions">
              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Investor'}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================
          INVESTORS TABLE & SEARCH BAR
      ====================================================== */}

      <div className="suppliers-table-card">

        <div className="suppliers-table-header">
          <div>
            <h2>Investor List</h2>

            <span>
              {filteredInvestors.length} investor
              {filteredInvestors.length !== 1 ? 's' : ''}
              {searchTerm && ` (filtered from ${investors.length})`}
            </span>
          </div>

          {/* SEARCH BAR (Matching Sales Page Structure) */}
          <div className="sales-search">
            <input
              type="text"
              placeholder="Search investor name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading && investors.length === 0 ? (
          <div className="supplier-loading">Loading investors...</div>
        ) : filteredInvestors.length === 0 ? (
          <div className="supplier-empty">
            <h3>No investors found</h3>

            <p>
              {searchTerm
                ? 'No investor matches your search criteria.'
                : 'Add your first investor to start managing investments and returns.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="suppliers-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Location</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredInvestors.map((investor) => {
                  const balanceStatus = getBalanceStatus(investor.balance);

                  return (
                    <tr key={investor._id}>
                      <td>
                        <div className="supplier-name-cell">
                          <strong>{investor.name}</strong>
                        </div>
                      </td>

                      <td>{investor.location || '-'}</td>

                      {/* BALANCE */}
                      <td>
                        <div className="supplier-balance-display">
                          <strong className={`supplier-balance ${balanceStatus.type}`}>
                            {formatBalance(investor.balance)}
                          </strong>

                          <small className={`supplier-balance-label ${balanceStatus.type}`}>
                            {balanceStatus.label}
                          </small>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className={`supplier-status ${investor.isActive ? 'active' : 'inactive'
                            }`}
                        >
                          {investor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="supplier-actions">
                          <button
                            className="action-btn ledger-btn"
                            onClick={() => openLedger(investor)}
                          >
                            Ledger
                          </button>

                          <button
                            className="action-btn purchase-btn"
                            onClick={() => openInvestmentModal(investor)}
                            disabled={!investor.isActive}
                          >
                            Investment
                          </button>

                          <button
                            className="action-btn payment-btn"
                            onClick={() => openReturnModal(investor)}
                            disabled={!investor.isActive}
                          >
                            Return
                          </button>

                          <button
                            className="action-btn edit-btn"
                            onClick={() => openEditInvestor(investor)}
                          >
                            Edit
                          </button>

                          <button
                            className="action-btn toggle-btn"
                            onClick={() => handleToggleInvestor(investor)}
                          >
                            {investor.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          {Number(investor.balance ?? 0) === 0 && (
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteInvestor(investor)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Investor Balance Total Summary Footer */}
              <tfoot>
                <tr>
                  <td colSpan="2">
                    <div className="supplier-footer-label">
                      Total Net Payable
                    </div>
                  </td>

                  <td>
                    <div className="supplier-footer-badge">
                      <div className="supplier-balance-display">
                        <strong className={`supplier-balance ${getBalanceStatus(totalBalance).type}`}>
                          {formatBalance(totalBalance)}
                        </strong>

                        <small className={`supplier-balance-label ${getBalanceStatus(totalBalance).type}`}>
                          {getBalanceStatus(totalBalance).label}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          EDIT INVESTOR MODAL
      ====================================================== */}

      {editingInvestor && (
        <div className="modal-overlay">
          <div className="supplier-modal">
            <div className="modal-header">
              <div>
                <h2>Edit Investor</h2>
                <p>Update investor information</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setEditingInvestor(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateInvestor}>
              <div className="form-group">
                <label>Investor Name</label>

                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Location / Address</label>

                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleEditFormChange}
                  placeholder="Investor location"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingInvestor(null)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Investor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          LEDGER MODAL
      ====================================================== */}

      {showLedger && selectedInvestor && (
        <div className="modal-overlay">
          <div className="supplier-ledger-modal">
            <div className="modal-header">
              <div>
                <h2>{selectedInvestor.name} Ledger</h2>
                <p>{selectedInvestor.location || 'No location added'}</p>
              </div>

              <button className="modal-close" onClick={closeLedger}>
                ×
              </button>
            </div>

            {/* CURRENT BALANCE */}
            <div className="supplier-ledger-summary">
              {(() => {
                const status = getBalanceStatus(
                  ledgerBalance ?? selectedInvestor.balance ?? 0
                );

                return (
                  <div className="supplier-ledger-summary-card">
                    <span>{status.label}</span>

                    <strong className={`ledger-current-balance ${status.type}`}>
                      {formatBalance(
                        ledgerBalance ?? selectedInvestor.balance ?? 0
                      )}
                    </strong>

                    <small>
                      {status.type === 'payable'
                        ? 'Amount payable to investor'
                        : status.type === 'advance'
                          ? 'Over-return to be adjusted'
                          : 'No outstanding balance'}
                    </small>
                  </div>
                );
              })()}
            </div>

            {/* LEDGER ACTIONS */}
            <div className="ledger-actions">
              <button
                className="action-btn purchase-btn"
                onClick={() => openInvestmentModal(selectedInvestor)}
                disabled={!selectedInvestor.isActive}
              >
                + Investment
              </button>

              <button
                className="action-btn payment-btn"
                onClick={() => openReturnModal(selectedInvestor)}
                disabled={!selectedInvestor.isActive}
              >
                + Return
              </button>
            </div>

            {/* TRANSACTIONS */}
            <div className="supplier-ledger-section">
              <div className="ledger-section-header">
                <div>
                  <h3>Transactions</h3>
                  <span>
                    {ledgerTransactions.length} transaction
                    {ledgerTransactions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {ledgerLoading ? (
                <div className="supplier-loading">Loading ledger...</div>
              ) : ledgerTransactions.length === 0 ? (
                <div className="supplier-empty">
                  <h3>No transactions</h3>
                  <p>
                    No investments or returns have been recorded
                    for this investor.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Balance After</th>
                        <th>Details</th>
                      </tr>
                    </thead>

                    <tbody>
                      {ledgerTransactions.map((transaction) => {
                        const balanceStatus = getBalanceStatus(
                          transaction.balanceAfter
                        );

                        return (
                          <tr key={transaction._id}>
                            <td>
                              {formatDate(
                                transaction.transactionDate ||
                                transaction.createdAt
                              )}
                            </td>

                            <td>
                              <span
                                className={`transaction-type ${transaction.type}`}
                              >
                                {transaction.type === 'investment'
                                  ? 'Investment'
                                  : 'Return'}
                              </span>
                            </td>

                            <td>
                              <strong>{formatAmount(transaction.amount)}</strong>
                            </td>

                            <td>
                              {transaction.paymentMethod
                                ? transaction.paymentMethod.toUpperCase()
                                : '-'}
                            </td>

                            <td>
                              <div className="ledger-balance-display">
                                <strong
                                  className={`ledger-balance ${balanceStatus.type}`}
                                >
                                  {formatBalance(transaction.balanceAfter)}
                                </strong>

                                <small
                                  className={`ledger-balance-label ${balanceStatus.type}`}
                                >
                                  {balanceStatus.label}
                                </small>
                              </div>
                            </td>

                            <td>
                              <button
                                className="view-transaction-btn"
                                onClick={() =>
                                  openTransactionDetails(transaction)
                                }
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          TRANSACTION DETAILS MODAL
      ====================================================== */}

      {showTransactionDetails && selectedTransaction && (
        <div className="modal-overlay">
          <div className="transaction-detail-modal">
            <div className="modal-header">
              <div>
                <h2>Transaction Details</h2>

                <p>
                  {selectedTransaction.type === 'investment'
                    ? 'Investment transaction'
                    : 'Return transaction'}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeTransactionDetails}
              >
                ×
              </button>
            </div>

            <div className="transaction-detail-grid">
              <div>
                <span>Date</span>

                <strong>
                  {formatDateTime(
                    selectedTransaction.transactionDate ||
                    selectedTransaction.createdAt
                  )}
                </strong>
              </div>

              <div>
                <span>Investor Location</span>

                <strong>
                  {selectedTransaction.investorLocation ||
                    'No location recorded'}
                </strong>
              </div>

              <div>
                <span>Type</span>

                <strong>
                  {selectedTransaction.type === 'investment'
                    ? 'Investment'
                    : 'Return'}
                </strong>
              </div>

              <div>
                <span>Amount</span>

                <strong>{formatAmount(selectedTransaction.amount)}</strong>
              </div>

              <div>
                <span>Payment Method</span>

                <strong>
                  {selectedTransaction.paymentMethod
                    ? selectedTransaction.paymentMethod.toUpperCase()
                    : '-'}
                </strong>
              </div>

              <div>
                <span>
                  {getBalanceStatus(selectedTransaction.balanceBefore).label}{' '}
                  Before
                </span>

                <strong
                  className={`ledger-balance ${getBalanceStatus(selectedTransaction.balanceBefore).type
                    }`}
                >
                  {formatBalance(selectedTransaction.balanceBefore)}
                </strong>
              </div>

              <div>
                <span>
                  {getBalanceStatus(selectedTransaction.balanceAfter).label}{' '}
                  After
                </span>

                <strong
                  className={`ledger-balance ${getBalanceStatus(selectedTransaction.balanceAfter).type
                    }`}
                >
                  {formatBalance(selectedTransaction.balanceAfter)}
                </strong>
              </div>
            </div>

            {selectedTransaction.note && (
              <div className="transaction-note">
                <span>Note</span>
                <p>{selectedTransaction.note}</p>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={closeTransactionDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          INVESTMENT MODAL  (direct amount, no dresses)
      ====================================================== */}

      {showInvestmentModal && investmentInvestor && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <div>
                <h2>Record Investment</h2>

                <p>
                  Investor: <strong>{investmentInvestor.name}</strong>
                </p>
              </div>

              <button className="modal-close" onClick={closeInvestmentModal}>
                ×
              </button>
            </div>

            {(() => {
              const status = getBalanceStatus(investmentInvestor.balance ?? 0);

              return (
                <div className="payment-current-balance">
                  <span>Current {status.label}</span>

                  <strong className={status.type}>
                    {formatBalance(investmentInvestor.balance ?? 0)}
                  </strong>
                </div>
              );
            })()}

            <div className="purchase-details-grid">
              <div className="form-group">
                <label>Transaction Date & Time</label>

                <input
                  type="text"
                  value={formatDateTime(currentDateTime)}
                  readOnly
                />

                <small>
                  Automatically recorded when you submit this investment.
                </small>
              </div>
            </div>

            <form onSubmit={handleCreateInvestment}>
              <div className="form-group">
                <label>Investment Amount</label>

                <input
                  type="number"
                  name="amount"
                  value={investmentForm.amount}
                  onChange={handleInvestmentFormChange}
                  placeholder="Enter investment amount"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Note</label>

                <input
                  type="text"
                  name="note"
                  value={investmentForm.note}
                  onChange={handleInvestmentFormChange}
                  placeholder="Optional note"
                />
              </div>

              <div className="payment-info">
                Investment will increase the amount the boutique owes
                the investor. No dresses or stock are affected by
                this entry.
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeInvestmentModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={investmentLoading}
                >
                  {investmentLoading ? 'Saving...' : 'Record Investment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          RETURN MODAL
      ====================================================== */}

      {showReturnModal && returnInvestor && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <div>
                <h2>Record Return</h2>

                <p>
                  Investor: <strong>{returnInvestor.name}</strong>
                </p>
              </div>

              <button className="modal-close" onClick={closeReturnModal}>
                ×
              </button>
            </div>

            {(() => {
              const status = getBalanceStatus(returnInvestor.balance ?? 0);

              return (
                <div className="payment-current-balance">
                  <span>Current {status.label}</span>

                  <strong className={status.type}>
                    {formatBalance(returnInvestor.balance ?? 0)}
                  </strong>
                </div>
              );
            })()}

            <div className="purchase-details-grid">
              <div className="form-group">
                <label>Transaction Date & Time</label>

                <input
                  type="text"
                  value={formatDateTime(currentDateTime)}
                  readOnly
                />

                <small>
                  Automatically recorded when you submit this return.
                </small>
              </div>
            </div>

            <form onSubmit={handleCreateReturn}>
              <div className="form-group">
                <label>Return Amount</label>

                <input
                  type="number"
                  name="amount"
                  value={returnForm.amount}
                  onChange={handleReturnFormChange}
                  placeholder="Enter return amount"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>

                <select
                  name="paymentMethod"
                  value={returnForm.paymentMethod}
                  onChange={handleReturnFormChange}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div className="form-group">
                <label>Note</label>

                <input
                  type="text"
                  name="note"
                  value={returnForm.note}
                  onChange={handleReturnFormChange}
                  placeholder="Optional note"
                />
              </div>

              <div className="payment-info">
                Return will reduce the outstanding balance to the investor.
                If you return more than the current balance, the extra
                amount will be recorded as an over-return and will
                automatically be adjusted against future investments.
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeReturnModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={returnLoading}
                >
                  {returnLoading ? 'Saving...' : 'Record Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Investors;