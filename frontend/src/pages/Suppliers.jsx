import { useEffect, useState } from 'react';
import api from '../api/api';

function Suppliers() {
  // =====================================================
  // SUPPLIER STATE
  // =====================================================

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Add supplier
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    location: '',
    balance: '',
  });

  // Edit supplier
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
  });

  const [editLoading, setEditLoading] = useState(false);

  // =====================================================
  // LEDGER STATE
  // =====================================================

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [ledgerBalance, setLedgerBalance] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Transaction detail
  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  // =====================================================
  // PRODUCTS / PURCHASE STATE
  // =====================================================

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [showPurchaseModal, setShowPurchaseModal] =
    useState(false);

  const [purchaseLoading, setPurchaseLoading] =
    useState(false);

  const [purchaseForm, setPurchaseForm] = useState({
    items: [
      {
        productId: '',
        quantity: '1',
        purchasePrice: '',
        searchTerm: '',
      },
    ],
    note: '',
  });

  // Which product-search dropdown is open
  const [openProductSearch, setOpenProductSearch] =
    useState(null);

  // =====================================================
  // PAYMENT STATE
  // =====================================================

  const [showPaymentModal, setShowPaymentModal] =
    useState(false);

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    note: '',
  });

  // =====================================================
  // FETCH SUPPLIERS
  // =====================================================

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setMessage('');

      const response = await api.get('/suppliers');

      setSuppliers(
        Array.isArray(response.data)
          ? response.data
          : [],
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Failed to load suppliers',
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);

      const response = await api.get('/products');

      setProducts(
        Array.isArray(response.data)
          ? response.data
          : [],
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Failed to load products',
      );
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  // =====================================================
  // ADD SUPPLIER
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setMessage('Supplier name is required');
      return;
    }

    if (
      form.balance !== '' &&
      Number(form.balance) < 0
    ) {
      setMessage('Opening balance cannot be negative');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await api.post('/suppliers', {
        name: form.name.trim(),
        location: form.location.trim(),
        ...(form.balance !== ''
          ? {
              balance: Number(form.balance),
            }
          : {}),
      });

      setForm({
        name: '',
        location: '',
        balance: '',
      });

      setShowForm(false);

      setMessage('Supplier added successfully');

      await fetchSuppliers();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Failed to add supplier',
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // EDIT SUPPLIER
  // =====================================================

  const openEditSupplier = (supplier) => {
    setEditingSupplier(supplier);

    setEditForm({
      name: supplier.name || '',
      location: supplier.location || '',
    });

    setMessage('');
  };

  const closeEditSupplier = () => {
    setEditingSupplier(null);

    setEditForm({
      name: '',
      location: '',
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEditSupplier = async (event) => {
    event.preventDefault();

    if (!editForm.name.trim()) {
      setMessage('Supplier name is required');
      return;
    }

    try {
      setEditLoading(true);
      setMessage('');

      await api.patch(
        `/suppliers/${editingSupplier._id}`,
        {
          name: editForm.name.trim(),
          location: editForm.location.trim(),
        },
      );

      setMessage('Supplier updated successfully');

      closeEditSupplier();

      await fetchSuppliers();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Failed to update supplier',
      );
    } finally {
      setEditLoading(false);
    }
  };

  // =====================================================
  // ACTIVATE / DEACTIVATE
  // =====================================================

  const toggleSupplierStatus = async (supplier) => {
    try {
      setMessage('');

      await api.patch(`/suppliers/${supplier._id}`, {
        isActive: !supplier.isActive,
      });

      setMessage(
        supplier.isActive
          ? 'Supplier deactivated'
          : 'Supplier activated',
      );

      await fetchSuppliers();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Failed to update supplier',
      );
    }
  };

  // =====================================================
  // DELETE SUPPLIER
  // =====================================================

  const deleteSupplier = async (supplier) => {
    const confirmed = window.confirm(
      `Delete supplier "${supplier.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage('');

      await api.delete(`/suppliers/${supplier._id}`);

      setMessage('Supplier deleted successfully');

      await fetchSuppliers();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Failed to delete supplier',
      );
    }
  };

  // =====================================================
  // LOAD SUPPLIER LEDGER
  // =====================================================

  const loadSupplierLedger = async (supplierId) => {
    try {
      setLedgerLoading(true);

      const [supplierResponse, ledgerResponse] =
        await Promise.all([
          api.get(`/suppliers/${supplierId}`),
          api.get(`/suppliers/${supplierId}/ledger`),
        ]);

      setSelectedSupplier(supplierResponse.data);

      const transactions = Array.isArray(
        ledgerResponse.data?.transactions,
      )
        ? ledgerResponse.data.transactions
        : [];

      setLedger(transactions);

      setLedgerBalance(
        ledgerResponse.data?.currentBalance ??
          supplierResponse.data?.balance ??
          0,
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Failed to load supplier ledger',
      );

      setSelectedSupplier(null);
      setLedger([]);
      setLedgerBalance(null);
    } finally {
      setLedgerLoading(false);
    }
  };

  const viewLedger = async (supplier) => {
    setMessage('');

    setSelectedSupplier(supplier);
    setLedger([]);
    setLedgerBalance(supplier.balance || 0);

    await loadSupplierLedger(supplier._id);
  };

  const refreshSelectedLedger = async (supplierId) => {
    try {
      const [supplierResponse, ledgerResponse] =
        await Promise.all([
          api.get(`/suppliers/${supplierId}`),
          api.get(`/suppliers/${supplierId}/ledger`),
        ]);

      setSelectedSupplier(supplierResponse.data);

      const transactions = Array.isArray(
        ledgerResponse.data?.transactions,
      )
        ? ledgerResponse.data.transactions
        : [];

      setLedger(transactions);

      setLedgerBalance(
        ledgerResponse.data?.currentBalance ??
          supplierResponse.data?.balance ??
          0,
      );
    } catch (error) {
      console.error(error);
    }
  };

  const closeLedger = () => {
    setSelectedSupplier(null);
    setLedger([]);
    setLedgerBalance(null);
    setSelectedTransaction(null);
    setShowPurchaseModal(false);
    setShowPaymentModal(false);
    setOpenProductSearch(null);
  };

  // =====================================================
  // PRODUCT LABEL
  // =====================================================

  const getProductLabel = (product) => {
    const parts = [];

    if (product.dressName) {
      parts.push(product.dressName);
    }

    if (product.brand) {
      parts.push(product.brand);
    }

    if (product.size) {
      parts.push(`Size: ${product.size}`);
    }

    if (product.color) {
      parts.push(`Color: ${product.color}`);
    }

    return parts.join(' • ');
  };

  // =====================================================
  // SEARCH PRODUCTS
  // =====================================================

  const getFilteredProducts = (index) => {
    const searchTerm =
      purchaseForm.items[index]?.searchTerm
        ?.trim()
        .toLowerCase() || '';

    if (!searchTerm) {
      return [];
    }

    if (searchTerm.length < 1) {
      return [];
    }

    return products
      .filter((product) => {
        const searchableText = [
          product.dressName,
          product.brand,
          product.category,
          product.size,
          product.color,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(searchTerm);
      })
      .slice(0, 50);
  };

  // =====================================================
  // PURCHASE FORM
  // =====================================================

  const openPurchaseModal = async () => {
    if (!selectedSupplier) {
      return;
    }

    setMessage('');

    if (products.length === 0) {
      await fetchProducts();
    }

    setPurchaseForm({
      items: [
        {
          productId: '',
          quantity: '1',
          purchasePrice: '',
          searchTerm: '',
        },
      ],
      note: '',
    });

    setOpenProductSearch(null);

    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    if (purchaseLoading) {
      return;
    }

    setShowPurchaseModal(false);
    setOpenProductSearch(null);

    setPurchaseForm({
      items: [
        {
          productId: '',
          quantity: '1',
          purchasePrice: '',
          searchTerm: '',
        },
      ],
      note: '',
    });
  };

  const handlePurchaseItemChange = (
    index,
    field,
    value,
  ) => {
    setPurchaseForm((previous) => {
      const updatedItems = [...previous.items];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      return {
        ...previous,
        items: updatedItems,
      };
    });

    // When user starts typing again after selecting
    // a product, clear the selected product.
    if (
      field === 'searchTerm' &&
      purchaseForm.items[index]?.productId
    ) {
      const selectedProduct = products.find(
        (product) =>
          product._id ===
          purchaseForm.items[index].productId,
      );

      const selectedLabel = selectedProduct
        ? getProductLabel(selectedProduct)
        : '';

      if (value !== selectedLabel) {
        setPurchaseForm((previous) => {
          const updatedItems = [...previous.items];

          updatedItems[index] = {
            ...updatedItems[index],
            productId: '',
            purchasePrice: '',
          };

          return {
            ...previous,
            items: updatedItems,
          };
        });
      }
    }
  };

  const selectPurchaseProduct = (
    index,
    product,
  ) => {
    setPurchaseForm((previous) => {
      const updatedItems = [...previous.items];

      updatedItems[index] = {
        ...updatedItems[index],
        productId: product._id,
        searchTerm: getProductLabel(product),
        purchasePrice:
          product.purchasePrice !== undefined &&
          product.purchasePrice !== null
            ? String(product.purchasePrice)
            : '',
      };

      return {
        ...previous,
        items: updatedItems,
      };
    });

    setOpenProductSearch(null);
  };

  const clearPurchaseProduct = (index) => {
    setPurchaseForm((previous) => {
      const updatedItems = [...previous.items];

      updatedItems[index] = {
        ...updatedItems[index],
        productId: '',
        searchTerm: '',
        purchasePrice: '',
      };

      return {
        ...previous,
        items: updatedItems,
      };
    });

    setOpenProductSearch(index);
  };

  const addPurchaseItem = () => {
    setPurchaseForm((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        {
          productId: '',
          quantity: '1',
          purchasePrice: '',
          searchTerm: '',
        },
      ],
    }));
  };

  const removePurchaseItem = (index) => {
    setPurchaseForm((previous) => {
      const updatedItems = previous.items.filter(
        (_, itemIndex) => itemIndex !== index,
      );

      return {
        ...previous,
        items:
          updatedItems.length > 0
            ? updatedItems
            : [
                {
                  productId: '',
                  quantity: '1',
                  purchasePrice: '',
                  searchTerm: '',
                },
              ],
      };
    });

    setOpenProductSearch(null);
  };

  const getPurchaseItemSubtotal = (item) => {
    const quantity = Number(item.quantity || 0);
    const price = Number(
      item.purchasePrice || 0,
    );

    return quantity * price;
  };

  const getPurchaseTotal = () => {
    return purchaseForm.items.reduce(
      (total, item) =>
        total + getPurchaseItemSubtotal(item),
      0,
    );
  };

  const handlePurchaseNoteChange = (event) => {
    setPurchaseForm((previous) => ({
      ...previous,
      note: event.target.value,
    }));
  };

  // =====================================================
  // SUBMIT PURCHASE
  // =====================================================

  const handlePurchaseSubmit = async (event) => {
    event.preventDefault();

    if (!selectedSupplier) {
      return;
    }

    const hasInvalidProduct =
      purchaseForm.items.some(
        (item) => !item.productId,
      );

    if (hasInvalidProduct) {
      setMessage(
        'Please select a product for every purchase item',
      );
      return;
    }

    const hasInvalidQuantity =
      purchaseForm.items.some(
        (item) =>
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) < 1,
      );

    if (hasInvalidQuantity) {
      setMessage(
        'Quantity must be a whole number greater than 0',
      );
      return;
    }

    const hasInvalidPrice =
      purchaseForm.items.some(
        (item) =>
          item.purchasePrice === '' ||
          Number(item.purchasePrice) < 0,
      );

    if (hasInvalidPrice) {
      setMessage(
        'Purchase price is required for every item',
      );
      return;
    }

    const productIds = purchaseForm.items.map(
      (item) => item.productId,
    );

    const hasDuplicates =
      new Set(productIds).size !== productIds.length;

    if (hasDuplicates) {
      setMessage(
        'The same dress cannot be added twice in one purchase. Increase its quantity instead.',
      );
      return;
    }

    try {
      setPurchaseLoading(true);
      setMessage('');

      await api.post(
        `/suppliers/${selectedSupplier._id}/purchases`,
        {
          items: purchaseForm.items.map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            purchasePrice: Number(
              item.purchasePrice,
            ),
          })),
          ...(purchaseForm.note.trim()
            ? {
                note: purchaseForm.note.trim(),
              }
            : {}),
        },
      );

      setMessage(
        'Purchase recorded successfully. Stock and supplier balance updated.',
      );

      setShowPurchaseModal(false);
      setOpenProductSearch(null);

      setPurchaseForm({
        items: [
          {
            productId: '',
            quantity: '1',
            purchasePrice: '',
            searchTerm: '',
          },
        ],
        note: '',
      });

      await fetchSuppliers();

      if (selectedSupplier) {
        await refreshSelectedLedger(
          selectedSupplier._id,
        );
      }

      await fetchProducts();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Failed to record purchase',
      );
    } finally {
      setPurchaseLoading(false);
    }
  };

  // =====================================================
  // PAYMENT
  // =====================================================

  const openPaymentModal = () => {
    if (!selectedSupplier) {
      return;
    }

    setMessage('');

    setPaymentForm({
      amount: '',
      paymentMethod: 'cash',
      note: '',
    });

    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    if (paymentLoading) {
      return;
    }

    setShowPaymentModal(false);

    setPaymentForm({
      amount: '',
      paymentMethod: 'cash',
      note: '',
    });
  };

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();

    if (!selectedSupplier) {
      return;
    }

    const amount = Number(paymentForm.amount);
    const currentBalance = Number(
      ledgerBalance ??
        selectedSupplier.balance ??
        0,
    );

    if (!amount || amount <= 0) {
      setMessage(
        'Payment amount must be greater than 0',
      );
      return;
    }

    if (amount > currentBalance) {
      setMessage(
        `Payment cannot be greater than the current balance of ${formatAmount(
          currentBalance,
        )}`,
      );
      return;
    }

    try {
      setPaymentLoading(true);
      setMessage('');

      await api.post(
        `/suppliers/${selectedSupplier._id}/payments`,
        {
          amount,
          paymentMethod:
            paymentForm.paymentMethod,
          ...(paymentForm.note.trim()
            ? {
                note: paymentForm.note.trim(),
              }
            : {}),
        },
      );

      setMessage(
        'Payment recorded successfully. Supplier balance updated.',
      );

      setShowPaymentModal(false);

      setPaymentForm({
        amount: '',
        paymentMethod: 'cash',
        note: '',
      });

      await fetchSuppliers();

      if (selectedSupplier) {
        await refreshSelectedLedger(
          selectedSupplier._id,
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Failed to record payment',
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // =====================================================
  // TRANSACTION DETAILS
  // =====================================================

  const viewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const closeTransaction = () => {
    setSelectedTransaction(null);
  };

  // =====================================================
  // FORMATTING
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return '—';
    }

    return new Date(date).toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    );
  };

  const formatDateTime = (date) => {
    if (!date) {
      return '—';
    }

    return new Date(date).toLocaleString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  };

  const formatAmount = (amount) => {
    if (
      amount === undefined ||
      amount === null
    ) {
      return '—';
    }

    return `Rs. ${Number(amount).toLocaleString()}`;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="suppliers-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="suppliers-header">
        <div>
          <h1>Suppliers</h1>

          <p>
            Manage suppliers, purchases, payments and
            supplier accounts.
          </p>
        </div>

        <button
          type="button"
          className="supplier-add-button"
          onClick={() => {
            setShowForm(!showForm);
            setMessage('');
          }}
        >
          {showForm
            ? 'Close'
            : '+ Add Supplier'}
        </button>
      </div>

      {/* =================================================
          MESSAGE
      ================================================= */}

      {message && (
        <div className="supplier-message">
          {message}
        </div>
      )}

      {/* =================================================
          ADD SUPPLIER
      ================================================= */}

      {showForm && (
        <div className="supplier-form-card">
          <h2>Add Supplier</h2>

          <form onSubmit={handleSubmit}>
            <div className="supplier-form-grid">
              <div className="supplier-field">
                <label>Supplier Name</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Maria.B"
                />
              </div>

              <div className="supplier-field">
                <label>
                  Location / Warehouse
                </label>

                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Hyderabad"
                />
              </div>

              <div className="supplier-field">
                <label>Opening Balance</label>

                <input
                  type="number"
                  name="balance"
                  min="0"
                  value={form.balance}
                  onChange={handleChange}
                  placeholder="0"
                />

                <small>
                  Optional. Initial amount owed to the
                  supplier.
                </small>
              </div>
            </div>

            <div className="supplier-form-actions">
              <button
                type="button"
                className="supplier-cancel-button"
                onClick={() => {
                  setShowForm(false);

                  setForm({
                    name: '',
                    location: '',
                    balance: '',
                  });
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="supplier-save-button"
                disabled={loading}
              >
                {loading
                  ? 'Saving...'
                  : 'Save Supplier'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================
          SUPPLIER TABLE
      ================================================= */}

      <div className="supplier-table-card">
        <div className="supplier-table-header">
          <div>
            <h2>Supplier Accounts</h2>

            <span className="supplier-count">
              {suppliers.length} supplier
              {suppliers.length !== 1
                ? 's'
                : ''}
            </span>
          </div>
        </div>

        {loading && suppliers.length === 0 ? (
          <div className="supplier-loading">
            Loading suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="supplier-empty">
            No suppliers found.
          </div>
        ) : (
          <div className="supplier-table-wrapper">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Location</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td>
                      <div className="supplier-name-cell">
                        <strong>
                          {supplier.name}
                        </strong>
                      </div>
                    </td>

                    <td>
                      {supplier.location || '—'}
                    </td>

                    <td>
                      <strong className="supplier-balance">
                        {formatAmount(
                          supplier.balance || 0,
                        )}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`supplier-status ${
                          supplier.isActive
                            ? 'active'
                            : 'inactive'
                        }`}
                      >
                        {supplier.isActive
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>

                    <td>
                      <div className="supplier-actions">
                        <button
                          type="button"
                          className="supplier-action ledger"
                          onClick={() =>
                            viewLedger(supplier)
                          }
                        >
                          View Ledger
                        </button>

                        <button
                          type="button"
                          className="supplier-action edit"
                          onClick={() =>
                            openEditSupplier(
                              supplier,
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="supplier-action toggle"
                          onClick={() =>
                            toggleSupplierStatus(
                              supplier,
                            )
                          }
                        >
                          {supplier.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>

                        {/* DELETE ONLY WHEN BALANCE <= 0 */}
                        {Number(
                          supplier.balance || 0,
                        ) <= 0 && (
                          <button
                            type="button"
                            className="supplier-action delete"
                            onClick={() =>
                              deleteSupplier(
                                supplier,
                              )
                            }
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          EDIT SUPPLIER MODAL
      ================================================= */}

      {editingSupplier && (
        <div
          className="supplier-modal-overlay"
          onClick={closeEditSupplier}
        >
          <div
            className="supplier-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="supplier-modal-header">
              <div>
                <h2>Edit Supplier</h2>
                <p>
                  Update supplier name or location.
                </p>
              </div>

              <button
                type="button"
                className="supplier-modal-close"
                onClick={closeEditSupplier}
              >
                ×
              </button>
            </div>

            <form
              className="supplier-modal-form"
              onSubmit={handleEditSupplier}
            >
              <div className="supplier-field">
                <label>Supplier Name</label>

                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  placeholder="Supplier name"
                />
              </div>

              <div className="supplier-field">
                <label>
                  Location / Address
                </label>

                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleEditChange}
                  placeholder="Supplier address / location"
                />
              </div>

              <div className="supplier-modal-actions">
                <button
                  type="button"
                  className="supplier-cancel-button"
                  onClick={closeEditSupplier}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="supplier-save-button"
                  disabled={editLoading}
                >
                  {editLoading
                    ? 'Updating...'
                    : 'Update Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          SUPPLIER LEDGER MODAL
      ================================================= */}

      {selectedSupplier && (
        <div
          className="supplier-ledger-overlay"
          onClick={closeLedger}
        >
          <div
            className="supplier-ledger-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="supplier-ledger-header">
              <div>
                <h2>
                  {selectedSupplier.name}
                </h2>

                <p>
                  {selectedSupplier.location ||
                    'No location specified'}
                </p>
              </div>

              <button
                type="button"
                className="supplier-ledger-close"
                onClick={closeLedger}
              >
                ×
              </button>
            </div>

            <div className="supplier-ledger-summary">
              <div className="supplier-ledger-summary-card">
                <span>Current Balance</span>

                <strong>
                  {formatAmount(
                    ledgerBalance ??
                      selectedSupplier.balance ??
                      0,
                  )}
                </strong>
              </div>

              <div className="supplier-ledger-summary-actions">
                <button
                  type="button"
                  className="supplier-purchase-button"
                  onClick={openPurchaseModal}
                >
                  + Record Purchase
                </button>

                <button
                  type="button"
                  className="supplier-payment-button"
                  onClick={openPaymentModal}
                >
                  + Record Payment
                </button>
              </div>
            </div>

            <div className="supplier-ledger-content">
              <div className="supplier-ledger-title-row">
                <div>
                  <h3>Transaction Ledger</h3>

                  <p>
                    Click View to see complete transaction
                    details.
                  </p>
                </div>
              </div>

              {ledgerLoading ? (
                <div className="supplier-loading">
                  Loading ledger...
                </div>
              ) : ledger.length === 0 ? (
                <div className="supplier-empty">
                  No transactions found for this
                  supplier.
                </div>
              ) : (
                <div className="supplier-table-wrapper">
                  <table className="supplier-ledger-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Balance</th>
                        <th>Details</th>
                      </tr>
                    </thead>

                    <tbody>
                      {ledger.map(
                        (transaction) => (
                          <tr
                            key={
                              transaction._id
                            }
                            className="ledger-row-clickable"
                          >
                            <td>
                              {formatDate(
                                transaction.transactionDate ||
                                  transaction.createdAt,
                              )}
                            </td>

                            <td>
                              <span
                                className={`ledger-type ${
                                  transaction.type ===
                                  'purchase'
                                    ? 'purchase'
                                    : 'payment'
                                }`}
                              >
                                {transaction.type ===
                                'purchase'
                                  ? 'Purchase'
                                  : 'Payment'}
                              </span>
                            </td>

                            <td>
                              <strong>
                                {formatAmount(
                                  transaction.amount,
                                )}
                              </strong>
                            </td>

                            <td>
                              {formatAmount(
                                transaction.balanceAfter,
                              )}
                            </td>

                            <td>
                              <button
                                type="button"
                                className="ledger-view-button"
                                onClick={() =>
                                  viewTransaction(
                                    transaction,
                                  )
                                }
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          PURCHASE MODAL
      ================================================= */}

      {showPurchaseModal &&
        selectedSupplier && (
          <div
            className="supplier-transaction-overlay"
            onClick={closePurchaseModal}
          >
            <div
              className="supplier-transaction-modal purchase-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="supplier-ledger-header">
                <div>
                  <h2>Record Purchase</h2>

                  <p>
                    Supplier:{' '}
                    <strong>
                      {selectedSupplier.name}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  className="supplier-ledger-close"
                  onClick={closePurchaseModal}
                  disabled={purchaseLoading}
                >
                  ×
                </button>
              </div>

              <form
                className="supplier-transaction-form"
                onSubmit={handlePurchaseSubmit}
              >
                <div className="supplier-transaction-info">
                  <span>
                    Purchase date is recorded automatically
                    using the current date and time.
                  </span>
                </div>

                <div className="purchase-items-header">
                  <div>
                    <h3>Purchased Dresses</h3>

                    <p>
                      Search by dress name, brand,
                      category, size or color.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="supplier-add-item-button"
                    onClick={addPurchaseItem}
                    disabled={purchaseLoading}
                  >
                    + Add Item
                  </button>
                </div>

                <div className="purchase-items-list">
                  {purchaseForm.items.map(
                    (item, index) => {
                      const selectedProduct =
                        products.find(
                          (product) =>
                            product._id ===
                            item.productId,
                        );

                      const filteredProducts =
                        getFilteredProducts(index);

                      return (
                        <div
                          className="purchase-item-row"
                          key={index}
                        >
                          {/* PRODUCT SEARCH */}
                          <div className="purchase-product-field">
                            <label>
                              Dress / Product
                            </label>

                            <div className="product-search-wrapper">
                              <div className="product-search-input-row">
                                <input
                                  type="text"
                                  className="product-search-input"
                                  value={
                                    item.searchTerm
                                  }
                                  onChange={(
                                    event,
                                  ) => {
                                    handlePurchaseItemChange(
                                      index,
                                      'searchTerm',
                                      event.target
                                        .value,
                                    );

                                    setOpenProductSearch(
                                      index,
                                    );
                                  }}
                                  onFocus={() => {
                                    if (
                                      !item.productId
                                    ) {
                                      setOpenProductSearch(
                                        index,
                                      );
                                    }
                                  }}
                                  placeholder="Search dress name, brand, category..."
                                  disabled={
                                    purchaseLoading ||
                                    productsLoading
                                  }
                                  autoComplete="off"
                                />

                                {item.productId && (
                                  <button
                                    type="button"
                                    className="product-search-clear"
                                    onClick={() =>
                                      clearPurchaseProduct(
                                        index,
                                      )
                                    }
                                    disabled={
                                      purchaseLoading
                                    }
                                    title="Clear product"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>

                              {/* SEARCH RESULTS */}
                              {openProductSearch ===
                                index &&
                                !item.productId &&
                                item.searchTerm.trim() && (
                                  <div className="product-search-results">
                                    {productsLoading ? (
                                      <div className="product-search-status">
                                        Loading products...
                                      </div>
                                    ) : filteredProducts.length ===
                                      0 ? (
                                      <div className="product-search-status">
                                        No matching dresses
                                        found.
                                      </div>
                                    ) : (
                                      <>
                                        {filteredProducts.map(
                                          (
                                            product,
                                          ) => (
                                            <button
                                              type="button"
                                              className="product-search-result"
                                              key={
                                                product._id
                                              }
                                              onClick={() =>
                                                selectPurchaseProduct(
                                                  index,
                                                  product,
                                                )
                                              }
                                            >
                                              <span className="product-search-result-main">
                                                <strong>
                                                  {
                                                    product.dressName
                                                  }
                                                </strong>

                                                <small>
                                                  {product.brand ||
                                                    'No brand'}
                                                </small>
                                              </span>

                                              <span className="product-search-result-meta">
                                                {product.category && (
                                                  <span>
                                                    {
                                                      product.category
                                                    }
                                                  </span>
                                                )}

                                                {product.size && (
                                                  <span>
                                                    Size:{' '}
                                                    {
                                                      product.size
                                                    }
                                                  </span>
                                                )}

                                                {product.color && (
                                                  <span>
                                                    Color:{' '}
                                                    {
                                                      product.color
                                                    }
                                                  </span>
                                                )}

                                                <span>
                                                  Stock:{' '}
                                                  {Number(
                                                    product.stockQuantity ||
                                                      0,
                                                  )}
                                                </span>

                                                {product.purchasePrice !==
                                                  undefined &&
                                                  product.purchasePrice !==
                                                    null && (
                                                    <span>
                                                      Purchase:{' '}
                                                      {formatAmount(
                                                        product.purchasePrice,
                                                      )}
                                                    </span>
                                                  )}
                                              </span>
                                            </button>
                                          ),
                                        )}

                                        {products.filter(
                                          (product) => {
                                            const text =
                                              [
                                                product.dressName,
                                                product.brand,
                                                product.category,
                                                product.size,
                                                product.color,
                                              ]
                                                .filter(
                                                  Boolean,
                                                )
                                                .join(
                                                  ' ',
                                                )
                                                .toLowerCase();

                                            return text.includes(
                                              item.searchTerm
                                                .trim()
                                                .toLowerCase(),
                                            );
                                          },
                                        ).length >
                                          50 && (
                                          <div className="product-search-more">
                                            Showing first 50
                                            matches. Refine
                                            your search for a
                                            specific dress.
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                            </div>

                            {/* SELECTED PRODUCT INFO */}
                            {selectedProduct && (
                              <div className="product-search-selected">
                                <div>
                                  <strong>
                                    {
                                      selectedProduct.dressName
                                    }
                                  </strong>

                                  <span>
                                    {selectedProduct.brand ||
                                      'No brand'}
                                  </span>
                                </div>

                                <div className="product-selected-meta">
                                  {selectedProduct.category && (
                                    <span>
                                      {
                                        selectedProduct.category
                                      }
                                    </span>
                                  )}

                                  {selectedProduct.size && (
                                    <span>
                                      Size:{' '}
                                      {
                                        selectedProduct.size
                                      }
                                    </span>
                                  )}

                                  {selectedProduct.color && (
                                    <span>
                                      Color:{' '}
                                      {
                                        selectedProduct.color
                                      }
                                    </span>
                                  )}

                                  <span>
                                    Current Stock:{' '}
                                    {Number(
                                      selectedProduct.stockQuantity ||
                                        0,
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* QUANTITY */}
                          <div className="purchase-quantity-field">
                            <label>Quantity</label>

                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(event) =>
                                handlePurchaseItemChange(
                                  index,
                                  'quantity',
                                  event.target
                                    .value,
                                )
                              }
                              disabled={
                                purchaseLoading
                              }
                            />
                          </div>

                          {/* PURCHASE PRICE */}
                          <div className="purchase-price-field">
                            <label>
                              Purchase Price
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.purchasePrice
                              }
                              onChange={(event) =>
                                handlePurchaseItemChange(
                                  index,
                                  'purchasePrice',
                                  event.target
                                    .value,
                                )
                              }
                              placeholder="0"
                              disabled={
                                purchaseLoading
                              }
                            />
                          </div>

                          {/* SUBTOTAL */}
                          <div className="purchase-item-subtotal">
                            <label>Subtotal</label>

                            <strong>
                              {formatAmount(
                                getPurchaseItemSubtotal(
                                  item,
                                ),
                              )}
                            </strong>
                          </div>

                          {/* REMOVE */}
                          <button
                            type="button"
                            className="purchase-remove-item"
                            onClick={() =>
                              removePurchaseItem(
                                index,
                              )
                            }
                            disabled={
                              purchaseLoading ||
                              purchaseForm.items
                                .length === 1
                            }
                            title="Remove item"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* NOTE */}
                <div className="supplier-field purchase-note-field">
                  <label>Note</label>

                  <textarea
                    value={purchaseForm.note}
                    onChange={
                      handlePurchaseNoteChange
                    }
                    placeholder="Optional purchase note..."
                    rows="3"
                    disabled={purchaseLoading}
                  />
                </div>

                {/* TOTAL */}
                <div className="purchase-total-box">
                  <span>Total Purchase</span>

                  <strong>
                    {formatAmount(
                      getPurchaseTotal(),
                    )}
                  </strong>
                </div>

                <div className="supplier-transaction-actions">
                  <button
                    type="button"
                    className="supplier-cancel-button"
                    onClick={closePurchaseModal}
                    disabled={purchaseLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="supplier-save-button"
                    disabled={purchaseLoading}
                  >
                    {purchaseLoading
                      ? 'Recording...'
                      : 'Record Purchase'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* =================================================
          PAYMENT MODAL
      ================================================= */}

      {showPaymentModal &&
        selectedSupplier && (
          <div
            className="supplier-transaction-overlay"
            onClick={closePaymentModal}
          >
            <div
              className="supplier-payment-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="supplier-ledger-header">
                <div>
                  <h2>Record Payment</h2>

                  <p>
                    Supplier:{' '}
                    <strong>
                      {selectedSupplier.name}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  className="supplier-ledger-close"
                  onClick={closePaymentModal}
                  disabled={paymentLoading}
                >
                  ×
                </button>
              </div>

              <form
                className="supplier-transaction-form"
                onSubmit={handlePaymentSubmit}
              >
                <div className="payment-current-balance">
                  <span>Current Balance</span>

                  <strong>
                    {formatAmount(
                      ledgerBalance ??
                        selectedSupplier.balance ??
                        0,
                    )}
                  </strong>
                </div>

                <div className="supplier-field">
                  <label>Payment Amount</label>

                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={handlePaymentChange}
                    placeholder="Enter payment amount"
                    disabled={paymentLoading}
                  />
                </div>

                <div className="supplier-field">
                  <label>Payment Method</label>

                  <select
                    name="paymentMethod"
                    value={
                      paymentForm.paymentMethod
                    }
                    onChange={handlePaymentChange}
                    disabled={paymentLoading}
                  >
                    <option value="cash">
                      Cash
                    </option>

                    <option value="bank">
                      Bank
                    </option>

                    <option value="card">
                      Card
                    </option>
                  </select>
                </div>

                <div className="supplier-field">
                  <label>Note</label>

                  <textarea
                    name="note"
                    value={paymentForm.note}
                    onChange={handlePaymentChange}
                    placeholder="Optional payment note..."
                    rows="3"
                    disabled={paymentLoading}
                  />
                </div>

                <div className="payment-info">
                  Payment will reduce the supplier's
                  outstanding balance.
                </div>

                <div className="supplier-transaction-actions">
                  <button
                    type="button"
                    className="supplier-cancel-button"
                    onClick={closePaymentModal}
                    disabled={paymentLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="supplier-save-button"
                    disabled={paymentLoading}
                  >
                    {paymentLoading
                      ? 'Recording...'
                      : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* =================================================
          TRANSACTION DETAIL MODAL
      ================================================= */}

      {selectedTransaction && (
        <div
          className="supplier-transaction-detail-overlay"
          onClick={closeTransaction}
        >
          <div
            className="supplier-transaction-detail-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="supplier-ledger-header">
              <div>
                <h2>
                  {selectedTransaction.type ===
                  'purchase'
                    ? 'Purchase Details'
                    : 'Payment Details'}
                </h2>

                <p>
                  {formatDateTime(
                    selectedTransaction.transactionDate ||
                      selectedTransaction.createdAt,
                  )}
                </p>
              </div>

              <button
                type="button"
                className="supplier-ledger-close"
                onClick={closeTransaction}
              >
                ×
              </button>
            </div>

            <div className="transaction-detail-grid">
              <div className="transaction-detail-card">
                <span>Supplier</span>

                <strong>
                  {
                    selectedTransaction.supplierName
                  }
                </strong>
              </div>

              <div className="transaction-detail-card">
                <span>Location</span>

                <strong>
                  {selectedTransaction.supplierLocation ||
                    '—'}
                </strong>
              </div>

              <div className="transaction-detail-card">
                <span>Transaction Type</span>

                <strong>
                  {selectedTransaction.type ===
                  'purchase'
                    ? 'Purchase'
                    : 'Payment'}
                </strong>
              </div>

              <div className="transaction-detail-card">
                <span>Amount</span>

                <strong>
                  {formatAmount(
                    selectedTransaction.amount,
                  )}
                </strong>
              </div>
            </div>

            <div className="transaction-balance-section">
              <div>
                <span>Balance Before</span>

                <strong>
                  {formatAmount(
                    selectedTransaction.balanceBefore,
                  )}
                </strong>
              </div>

              <div>
                <span>Balance After</span>

                <strong>
                  {formatAmount(
                    selectedTransaction.balanceAfter,
                  )}
                </strong>
              </div>
            </div>

            {/* PURCHASE DETAILS */}
            {selectedTransaction.type ===
              'purchase' && (
              <div className="transaction-items-section">
                <h3 className="transaction-section-title">
                  Purchased Items
                </h3>

                {selectedTransaction.items?.length ? (
                  <div className="supplier-table-wrapper">
                    <table className="transaction-items-table">
                      <thead>
                        <tr>
                          <th>Dress</th>
                          <th>Quantity</th>
                          <th>Purchase Price</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedTransaction.items.map(
                          (item, index) => (
                            <tr
                              key={
                                item._id ||
                                `${item.product}-${index}`
                              }
                            >
                              <td>
                                <strong>
                                  {
                                    item.dressName
                                  }
                                </strong>
                              </td>

                              <td>
                                {item.quantity}
                              </td>

                              <td>
                                {formatAmount(
                                  item.purchasePrice,
                                )}
                              </td>

                              <td>
                                <strong>
                                  {formatAmount(
                                    item.subtotal,
                                  )}
                                </strong>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="supplier-empty">
                    No purchase items found.
                  </div>
                )}
              </div>
            )}

            {/* PAYMENT DETAILS */}
            {selectedTransaction.type ===
              'payment' && (
              <div className="transaction-payment-section">
                <div className="transaction-info-row">
                  <span>Payment Method</span>

                  <strong>
                    {selectedTransaction.paymentMethod
                      ? selectedTransaction.paymentMethod
                          .charAt(0)
                          .toUpperCase() +
                        selectedTransaction.paymentMethod.slice(
                          1,
                        )
                      : '—'}
                  </strong>
                </div>
              </div>
            )}

            {/* NOTE */}
            {selectedTransaction.note && (
              <div className="transaction-note">
                <span>Note</span>

                <p>
                  {selectedTransaction.note}
                </p>
              </div>
            )}

            <div className="transaction-detail-actions">
              <button
                type="button"
                className="supplier-cancel-button"
                onClick={closeTransaction}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;