import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';

function Employees() {
  // =========================================================
  // STATE
  // =========================================================

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const [currentDateTime, setCurrentDateTime] =
    useState(new Date());

  // Add employee
  const [showAddForm, setShowAddForm] = useState(false);

  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    designation: '',
    phone: '',
    address: '',
    joiningDate: '',
    basicSalary: '',
    openingBalance: '',
  });

  // Edit employee
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    designation: '',
    phone: '',
    address: '',
    joiningDate: '',
    basicSalary: '',
  });

  // Ledger
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [ledgerBalance, setLedgerBalance] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [showLedger, setShowLedger] = useState(false);

  // Transaction details
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  // Transaction modal (single modal, type dropdown)
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [txnEmployee, setTxnEmployee] = useState(null);
  const [txnForm, setTxnForm] = useState({
    type: 'salary',
    amount: '',
    paymentMethod: 'cash',
    note: '',
  });
  const [txnLoading, setTxnLoading] = useState(false);

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
  // FETCH EMPLOYEES
  // =========================================================

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setMessage('');

      const response = await api.get('/employees');
      const employeeData = response.data || [];
      setEmployees(employeeData);
      return employeeData;
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to load employees',
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // =========================================================
  // FILTERED EMPLOYEES & TOTAL COMPUTATION
  // =========================================================

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return employees;

    return employees.filter(
      (employee) =>
        employee.name?.toLowerCase().includes(term) ||
        employee.designation?.toLowerCase().includes(term) ||
        employee.phone?.toLowerCase().includes(term),
    );
  }, [employees, searchTerm]);

  const totalBalance = useMemo(() => {
    return filteredEmployees.reduce(
      (acc, employee) => acc + Number(employee.balance ?? 0),
      0,
    );
  }, [filteredEmployees]);

  const totalMonthlySalary = useMemo(() => {
    return filteredEmployees.reduce(
      (acc, employee) => acc + Number(employee.basicSalary ?? 0),
      0,
    );
  }, [filteredEmployees]);

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
    if (!date) return '-';

    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // =========================================================
  // BALANCE STATUS
  // =========================================================
  //
  // Positive = we owe employee.
  // Negative = employee owes us (over-paid).
  // Zero     = settled.
  //
  // We reuse the same CSS classes as suppliers/investors.
  // =========================================================

  const getBalanceStatus = (balance) => {
    const amount = Number(balance ?? 0);

    if (amount > 0) {
      return { type: 'payable', label: 'Payable', amount };
    }

    if (amount < 0) {
      return { type: 'advance', label: 'Over-Paid', amount: Math.abs(amount) };
    }

    return { type: 'settled', label: 'Settled', amount: 0 };
  };

  const formatBalance = (balance) => {
    const status = getBalanceStatus(balance);
    return formatAmount(status.amount);
  };

  // =========================================================
  // TRANSACTION TYPE HELPERS
  // =========================================================

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'salary':    return 'Salary';
      case 'payment':   return 'Payment';
      case 'advance':   return 'Advance';
      case 'bonus':     return 'Bonus';
      case 'deduction': return 'Deduction';
      default:          return type;
    }
  };

  const getTransactionClass = (type) => {
    switch (type) {
      case 'salary':
      case 'bonus':
        return 'purchase';   // reuse green purchase styling

      case 'payment':
      case 'advance':
      case 'deduction':
        return 'payment';    // reuse red payment styling

      default:
        return 'payment';
    }
  };

  // =========================================================
  // ADD EMPLOYEE
  // =========================================================

  const handleEmployeeFormChange = (e) => {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();

    if (!employeeForm.name.trim()) {
      setMessage('Employee name is required');
      return;
    }

    if (!employeeForm.designation.trim()) {
      setMessage('Employee designation is required');
      return;
    }

    const basicSalary = Number(employeeForm.basicSalary);
    if (!Number.isFinite(basicSalary) || basicSalary < 0) {
      setMessage('Basic salary must be 0 or greater');
      return;
    }

    if (employeeForm.openingBalance !== '') {
      const openingBalance = Number(employeeForm.openingBalance);

      if (!Number.isFinite(openingBalance) || openingBalance < 0) {
        setMessage('Opening balance must be 0 or greater');
        return;
      }
    }

    try {
      setLoading(true);
      setMessage('');

      const payload = {
        name: employeeForm.name.trim(),
        designation: employeeForm.designation.trim(),
        basicSalary,
      };

      if (employeeForm.phone.trim())   payload.phone = employeeForm.phone.trim();
      if (employeeForm.address.trim()) payload.address = employeeForm.address.trim();
      if (employeeForm.joiningDate)    payload.joiningDate = employeeForm.joiningDate;

      if (
        employeeForm.openingBalance !== '' &&
        employeeForm.openingBalance !== null
      ) {
        payload.balance = Number(employeeForm.openingBalance);
      }

      await api.post('/employees', payload);

      setMessage('Employee added successfully');

      setEmployeeForm({
        name: '',
        designation: '',
        phone: '',
        address: '',
        joiningDate: '',
        basicSalary: '',
        openingBalance: '',
      });

      setShowAddForm(false);
      await fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to add employee',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // EDIT EMPLOYEE
  // =========================================================

  const openEditEmployee = (employee) => {
    setEditingEmployee(employee);

    setEditForm({
      name: employee.name || '',
      designation: employee.designation || '',
      phone: employee.phone || '',
      address: employee.address || '',
      joiningDate: employee.joiningDate
        ? new Date(employee.joiningDate).toISOString().slice(0, 10)
        : '',
      basicSalary: employee.basicSalary ?? '',
    });

    setMessage('');
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();

    if (!editForm.name.trim()) {
      setMessage('Employee name is required');
      return;
    }

    if (!editForm.designation.trim()) {
      setMessage('Employee designation is required');
      return;
    }

    if (!editingEmployee) return;

    try {
      setLoading(true);
      setMessage('');

      const payload = {
        name: editForm.name.trim(),
        designation: editForm.designation.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
        basicSalary: Number(editForm.basicSalary) || 0,
      };

      if (editForm.joiningDate) {
        payload.joiningDate = editForm.joiningDate;
      }

      await api.patch(`/employees/${editingEmployee._id}`, payload);

      setMessage('Employee updated successfully');
      setEditingEmployee(null);
      await fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to update employee',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // ACTIVATE / DEACTIVATE
  // =========================================================

  const handleToggleEmployee = async (employee) => {
    try {
      setLoading(true);
      setMessage('');

      await api.patch(`/employees/${employee._id}`, {
        isActive: !employee.isActive,
      });

      setMessage(
        employee.isActive
          ? 'Employee deactivated successfully'
          : 'Employee activated successfully',
      );

      await fetchEmployees();
    } catch (error) {
      console.error('Error updating employee status:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to update employee status',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // DELETE EMPLOYEE
  // =========================================================

  const handleDeleteEmployee = async (employee) => {
    const balance = Number(employee.balance ?? 0);

    if (balance !== 0) {
      setMessage(
        balance > 0
          ? 'Employee cannot be deleted while an unpaid salary balance exists. Clear the balance first.'
          : 'Employee cannot be deleted while an over-paid balance exists. Settle the account first.',
      );
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${employee.name}?`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await api.delete(`/employees/${employee._id}`);

      setMessage('Employee deleted successfully');
      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to delete employee',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LEDGER
  // =========================================================

  const openLedger = async (employee) => {
    setSelectedEmployee(employee);
    setShowLedger(true);
    setLedgerLoading(true);
    setLedgerTransactions([]);
    setLedgerBalance(null);
    setMessage('');

    try {
      const response = await api.get(`/employees/${employee._id}/ledger`);

      const employeeData = response.data?.employee;

      const currentBalance =
        response.data?.currentBalance ??
        employeeData?.balance ??
        employee.balance ??
        0;

      setLedgerTransactions(response.data?.transactions || []);
      setLedgerBalance(currentBalance);

      if (employeeData) setSelectedEmployee(employeeData);
    } catch (error) {
      console.error('Error fetching employee ledger:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to load employee ledger',
      );
    } finally {
      setLedgerLoading(false);
    }
  };

  const closeLedger = () => {
    setShowLedger(false);
    setSelectedEmployee(null);
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
  // TRANSACTION MODAL (single modal, type dropdown)
  // =========================================================

  const openTransactionModal = (employee, presetType = 'salary') => {
    setTxnEmployee(employee);

    setTxnForm({
      type: presetType,
      amount:
        presetType === 'salary'
          ? String(employee.basicSalary ?? '')
          : '',
      paymentMethod: 'cash',
      note: '',
    });

    setCurrentDateTime(new Date());
    setShowTransactionModal(true);
    setMessage('');
  };

  const closeTransactionModal = () => {
    setShowTransactionModal(false);
    setTxnEmployee(null);

    setTxnForm({
      type: 'salary',
      amount: '',
      paymentMethod: 'cash',
      note: '',
    });
  };

  const handleTxnFormChange = (e) => {
    const { name, value } = e.target;
    setTxnForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();

    if (!txnEmployee) return;

    const amount = Number(txnForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Transaction amount must be greater than 0');
      return;
    }

    try {
      setTxnLoading(true);
      setMessage('');

      const payload = {
        type: txnForm.type,
        amount,
      };

      // paymentMethod only for money-out types
      if (
        txnForm.type === 'payment' ||
        txnForm.type === 'advance'
      ) {
        payload.paymentMethod = txnForm.paymentMethod;
      }

      if (txnForm.note.trim()) {
        payload.note = txnForm.note.trim();
      }

      await api.post(
        `/employees/${txnEmployee._id}/transactions`,
        payload,
      );

      closeTransactionModal();
      await fetchEmployees();

      if (
        selectedEmployee &&
        selectedEmployee._id === txnEmployee._id
      ) {
        const fresh = await api.get(`/employees/${txnEmployee._id}`);
        await openLedger(fresh.data);
      }

      setMessage('Transaction recorded successfully');
    } catch (error) {
      console.error('Error creating transaction:', error);
      console.error('Backend response:', error.response?.data);

      const backendMessage = error.response?.data?.message;

      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || 'Failed to record transaction',
      );
    } finally {
      setTxnLoading(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="suppliers-page">

      {/* HEADER */}
      <div className="suppliers-header">
        <div>
          <h1>Employees</h1>
          <p>Manage employees, salary accruals, payments, advances, bonuses and deductions.</p>
        </div>

        <button
          className="add-supplier-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Close' : '+ Add Employee'}
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className="supplier-message">{message}</div>
      )}

      {/* ADD EMPLOYEE FORM */}
      {showAddForm && (
        <div className="supplier-form-card">
          <div className="supplier-form-header">
            <h2>Add Employee</h2>
          </div>

          <form onSubmit={handleAddEmployee}>
            <div className="supplier-form-grid">
              <div className="form-group">
                <label>Employee Name</label>
                <input
                  type="text"
                  name="name"
                  value={employeeForm.name}
                  onChange={handleEmployeeFormChange}
                  placeholder="Enter employee name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={employeeForm.designation}
                  onChange={handleEmployeeFormChange}
                  placeholder="Salesperson, Tailor, Manager..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={employeeForm.phone}
                  onChange={handleEmployeeFormChange}
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={employeeForm.address}
                  onChange={handleEmployeeFormChange}
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label>Joining Date</label>
                <input
                  type="date"
                  name="joiningDate"
                  value={employeeForm.joiningDate}
                  onChange={handleEmployeeFormChange}
                />
              </div>

              <div className="form-group">
                <label>Basic Monthly Salary</label>
                <input
                  type="number"
                  name="basicSalary"
                  value={employeeForm.basicSalary}
                  onChange={handleEmployeeFormChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Opening Balance</label>
                <input
                  type="number"
                  name="openingBalance"
                  value={employeeForm.openingBalance}
                  onChange={handleEmployeeFormChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                <small>Optional. Unpaid salary already owed at system start.</small>
              </div>
            </div>

            <div className="supplier-form-actions">
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save Employee'}
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

      {/* EMPLOYEES TABLE */}
      <div className="suppliers-table-card">
        <div className="suppliers-table-header">
          <div>
            <h2>Employee List</h2>
            <span>
              {filteredEmployees.length} employee
              {filteredEmployees.length !== 1 ? 's' : ''}
              {searchTerm && ` (filtered from ${employees.length})`}
            </span>
          </div>

          <div className="sales-search">
            <input
              type="text"
              placeholder="Search name, designation or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')}>
                Clear
              </button>
            )}
          </div>
        </div>

        {loading && employees.length === 0 ? (
          <div className="supplier-loading">Loading employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="supplier-empty">
            <h3>No employees found</h3>
            <p>
              {searchTerm
                ? 'No employee matches your search criteria.'
                : 'Add your first employee to start managing salaries.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="suppliers-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Basic Salary</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((employee) => {
                  const balanceStatus = getBalanceStatus(employee.balance);

                  return (
                    <tr key={employee._id}>
                      <td>
                        <div className="supplier-name-cell">
                          <strong>{employee.name}</strong>
                          {employee.phone && (
                            <small>{employee.phone}</small>
                          )}
                        </div>
                      </td>

                      <td>{employee.designation || '-'}</td>

                      <td>
                        <strong>{formatAmount(employee.basicSalary)}</strong>
                      </td>

                      <td>
                        <div className="supplier-balance-display">
                          <strong className={`supplier-balance ${balanceStatus.type}`}>
                            {formatBalance(employee.balance)}
                          </strong>
                          <small className={`supplier-balance-label ${balanceStatus.type}`}>
                            {balanceStatus.label}
                          </small>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`supplier-status ${employee.isActive ? 'active' : 'inactive'}`}
                        >
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td>
                        <div className="supplier-actions">
                          <button
                            className="action-btn ledger-btn"
                            onClick={() => openLedger(employee)}
                          >
                            Ledger
                          </button>

                          <button
                            className="action-btn purchase-btn"
                            onClick={() => openTransactionModal(employee, 'salary')}
                            disabled={!employee.isActive}
                          >
                            Salary
                          </button>

                          <button
                            className="action-btn payment-btn"
                            onClick={() => openTransactionModal(employee, 'payment')}
                            disabled={!employee.isActive}
                          >
                            Pay
                          </button>

                          <button
                            className="action-btn edit-btn"
                            onClick={() => openEditEmployee(employee)}
                          >
                            Edit
                          </button>

                          <button
                            className="action-btn toggle-btn"
                            onClick={() => handleToggleEmployee(employee)}
                          >
                            {employee.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          {Number(employee.balance ?? 0) === 0 && (
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteEmployee(employee)}
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

              <tfoot>
                <tr>
                  <td colSpan="2">
                    <div className="supplier-footer-label">
                      Total Monthly Salary
                    </div>
                  </td>

                  <td>
                    <strong>{formatAmount(totalMonthlySalary)}</strong>
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

      {/* EDIT EMPLOYEE MODAL */}
      {editingEmployee && (
        <div className="modal-overlay">
          <div className="supplier-modal">
            <div className="modal-header">
              <div>
                <h2>Edit Employee</h2>
                <p>Update employee information</p>
              </div>
              <button
                className="modal-close"
                onClick={() => setEditingEmployee(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee}>
              <div className="form-group">
                <label>Employee Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={editForm.designation}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={editForm.address}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="form-group">
                <label>Joining Date</label>
                <input
                  type="date"
                  name="joiningDate"
                  value={editForm.joiningDate}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="form-group">
                <label>Basic Monthly Salary</label>
                <input
                  type="number"
                  name="basicSalary"
                  value={editForm.basicSalary}
                  onChange={handleEditFormChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingEmployee(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEDGER MODAL */}
      {showLedger && selectedEmployee && (
        <div className="modal-overlay">
          <div className="supplier-ledger-modal">
            <div className="modal-header">
              <div>
                <h2>{selectedEmployee.name} Ledger</h2>
                <p>{selectedEmployee.designation || 'No designation'}</p>
              </div>
              <button className="modal-close" onClick={closeLedger}>
                ×
              </button>
            </div>

            {/* CURRENT BALANCE */}
            <div className="supplier-ledger-summary">
              {(() => {
                const status = getBalanceStatus(
                  ledgerBalance ?? selectedEmployee.balance ?? 0,
                );

                return (
                  <div className="supplier-ledger-summary-card">
                    <span>{status.label}</span>
                    <strong className={`ledger-current-balance ${status.type}`}>
                      {formatBalance(
                        ledgerBalance ?? selectedEmployee.balance ?? 0,
                      )}
                    </strong>
                    <small>
                      {status.type === 'payable'
                        ? 'Unpaid salary owed to employee'
                        : status.type === 'advance'
                          ? 'Over-paid amount to be adjusted'
                          : 'No outstanding balance'}
                    </small>
                  </div>
                );
              })()}
            </div>

            {/* LEDGER ACTIONS — one modal for all types */}
            <div className="ledger-actions">
              <button
                className="action-btn purchase-btn"
                onClick={() => openTransactionModal(selectedEmployee, 'salary')}
                disabled={!selectedEmployee.isActive}
              >
                + Salary
              </button>

              <button
                className="action-btn payment-btn"
                onClick={() => openTransactionModal(selectedEmployee, 'payment')}
                disabled={!selectedEmployee.isActive}
              >
                + Payment
              </button>

              <button
                className="action-btn ledger-btn"
                onClick={() => openTransactionModal(selectedEmployee, 'advance')}
                disabled={!selectedEmployee.isActive}
              >
                + Advance
              </button>

              <button
                className="action-btn edit-btn"
                onClick={() => openTransactionModal(selectedEmployee, 'bonus')}
                disabled={!selectedEmployee.isActive}
              >
                + Bonus
              </button>

              <button
                className="action-btn toggle-btn"
                onClick={() => openTransactionModal(selectedEmployee, 'deduction')}
                disabled={!selectedEmployee.isActive}
              >
                + Deduction
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
                  <p>No salary or payment entries recorded for this employee.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Balance After</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerTransactions.map((transaction) => {
                        const balanceStatus = getBalanceStatus(
                          transaction.balanceAfter,
                        );

                        return (
                          <tr key={transaction._id}>
                            <td>
                              {formatDate(
                                transaction.transactionDate ||
                                transaction.createdAt,
                              )}
                            </td>

                            <td>
                              <span
                                className={`transaction-type ${getTransactionClass(transaction.type)}`}
                              >
                                {getTransactionLabel(transaction.type)}
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
                                onClick={() => openTransactionDetails(transaction)}
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

      {/* TRANSACTION DETAILS MODAL */}
      {showTransactionDetails && selectedTransaction && (
        <div className="modal-overlay">
          <div className="transaction-detail-modal">
            <div className="modal-header">
              <div>
                <h2>Transaction Details</h2>
                <p>{getTransactionLabel(selectedTransaction.type)} transaction</p>
              </div>
              <button className="modal-close" onClick={closeTransactionDetails}>
                ×
              </button>
            </div>

            <div className="transaction-detail-grid">
              <div>
                <span>Date</span>
                <strong>
                  {formatDateTime(
                    selectedTransaction.transactionDate ||
                    selectedTransaction.createdAt,
                  )}
                </strong>
              </div>

              <div>
                <span>Designation</span>
                <strong>
                  {selectedTransaction.employeeDesignation || '-'}
                </strong>
              </div>

              <div>
                <span>Type</span>
                <strong>{getTransactionLabel(selectedTransaction.type)}</strong>
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
                  {getBalanceStatus(selectedTransaction.balanceBefore).label} Before
                </span>
                <strong
                  className={`ledger-balance ${getBalanceStatus(selectedTransaction.balanceBefore).type}`}
                >
                  {formatBalance(selectedTransaction.balanceBefore)}
                </strong>
              </div>

              <div>
                <span>
                  {getBalanceStatus(selectedTransaction.balanceAfter).label} After
                </span>
                <strong
                  className={`ledger-balance ${getBalanceStatus(selectedTransaction.balanceAfter).type}`}
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
              <button className="secondary-btn" onClick={closeTransactionDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION MODAL — ONE MODAL FOR ALL TYPES */}
      {showTransactionModal && txnEmployee && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <div>
                <h2>Record Transaction</h2>
                <p>
                  Employee: <strong>{txnEmployee.name}</strong>
                  {' '}— {txnEmployee.designation}
                </p>
              </div>
              <button className="modal-close" onClick={closeTransactionModal}>
                ×
              </button>
            </div>

            {(() => {
              const status = getBalanceStatus(txnEmployee.balance ?? 0);
              return (
                <div className="payment-current-balance">
                  <span>Current {status.label}</span>
                  <strong className={status.type}>
                    {formatBalance(txnEmployee.balance ?? 0)}
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
                <small>Automatically recorded when you submit.</small>
              </div>
            </div>

            <form onSubmit={handleCreateTransaction}>
              <div className="form-group">
                <label>Transaction Type</label>
                <select
                  name="type"
                  value={txnForm.type}
                  onChange={handleTxnFormChange}
                >
                  <option value="salary">Salary (accrue)</option>
                  <option value="payment">Payment (pay salary)</option>
                  <option value="advance">Advance (pay early)</option>
                  <option value="bonus">Bonus (extra reward)</option>
                  <option value="deduction">Deduction (fine)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={txnForm.amount}
                  onChange={handleTxnFormChange}
                  placeholder="Enter amount"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              {(txnForm.type === 'payment' ||
                txnForm.type === 'advance') && (
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={txnForm.paymentMethod}
                    onChange={handleTxnFormChange}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Note</label>
                <input
                  type="text"
                  name="note"
                  value={txnForm.note}
                  onChange={handleTxnFormChange}
                  placeholder="Optional note"
                />
              </div>

              <div className="payment-info">
                {txnForm.type === 'salary' &&
                  'Salary accrual increases what the boutique owes the employee.'}
                {txnForm.type === 'payment' &&
                  'Payment reduces the outstanding balance.'}
                {txnForm.type === 'advance' &&
                  'Advance is money given before salary is earned. It reduces the balance (may go negative).'}
                {txnForm.type === 'bonus' &&
                  'Bonus increases what the boutique owes the employee.'}
                {txnForm.type === 'deduction' &&
                  'Deduction reduces the outstanding balance (fine/penalty).'}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeTransactionModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={txnLoading}
                >
                  {txnLoading ? 'Saving...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Employees;