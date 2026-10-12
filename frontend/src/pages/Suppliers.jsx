import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';

function Suppliers() {
  // =========================================================
  // STATE
  // =========================================================

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Supplier Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Current date/time display
  const [currentDateTime, setCurrentDateTime] =
    useState(new Date());

  // Add supplier
  const [showAddForm, setShowAddForm] = useState(false);

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    location: '',
    openingBalance: '',
  });

  // Edit supplier
  const [editingSupplier, setEditingSupplier] =
    useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
  });

  // Ledger
  const [selectedSupplier, setSelectedSupplier] =
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

  // Purchase
  const [showPurchaseModal, setShowPurchaseModal] =
    useState(false);

  const [purchaseSupplier, setPurchaseSupplier] =
    useState(null);

  const [purchaseItems, setPurchaseItems] =
    useState([]);

  const [purchaseNote, setPurchaseNote] =
    useState('');

  const [productSearch, setProductSearch] =
    useState('');

  const [products, setProducts] =
    useState([]);

  const [productsLoading, setProductsLoading] =
    useState(false);

  // Payment
  const [showPaymentModal, setShowPaymentModal] =
    useState(false);

  const [paymentSupplier, setPaymentSupplier] =
    useState(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    note: '',
  });

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  // Return
  const [showReturnModal, setShowReturnModal] =
    useState(false);

  const [returnSupplier, setReturnSupplier] =
    useState(null);

  const [returnItems, setReturnItems] =
    useState([]);

  const [returnNote, setReturnNote] =
    useState('');

  const [returnProductSearch, setReturnProductSearch] =
    useState('');

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
  // FETCH SUPPLIERS
  // =========================================================

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setMessage('');

      const response = await api.get('/suppliers');

      const supplierData = response.data || [];

      setSuppliers(supplierData);

      return supplierData;
    } catch (error) {
      console.error(
        'Error fetching suppliers:',
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
          'Failed to load suppliers',
      );

      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // =========================================================
  // FILTERED SUPPLIERS & TOTAL BALANCE COMPUTATION
  // =========================================================

  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return suppliers;

    return suppliers.filter(
      (supplier) =>
        supplier.name?.toLowerCase().includes(term) ||
        supplier.location?.toLowerCase().includes(term)
    );
  }, [suppliers, searchTerm]);

  const totalBalance = useMemo(() => {
    return filteredSuppliers.reduce(
      (acc, supplier) => acc + Number(supplier.balance ?? 0),
      0
    );
  }, [filteredSuppliers]);

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
  // SUPPLIER BALANCE STATUS
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
        label: 'Advance',
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
  // TRANSACTION TYPE LABEL (shared helper)
  // =========================================================

  const getTransactionTypeLabel = (type) => {
    if (type === 'purchase') return 'Purchase';
    if (type === 'return') return 'Return';
    if (type === 'payment') return 'Payment';
    return type;
  };

  // =========================================================
  // ADD SUPPLIER
  // =========================================================

  const handleSupplierFormChange = (e) => {
    const { name, value } = e.target;

    setSupplierForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();

    if (!supplierForm.name.trim()) {
      setMessage(
        'Supplier name is required',
      );
      return;
    }

    if (supplierForm.openingBalance !== '') {
      const openingBalance = Number(
        supplierForm.openingBalance,
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
        name: supplierForm.name.trim(),
        location:
          supplierForm.location.trim(),
      };

      if (
        supplierForm.openingBalance !== '' &&
        supplierForm.openingBalance !== null
      ) {
        payload.balance = Number(
          supplierForm.openingBalance,
        );
      }

      await api.post(
        '/suppliers',
        payload,
      );

      setMessage(
        'Supplier added successfully',
      );

      setSupplierForm({
        name: '',
        location: '',
        openingBalance: '',
      });

      setShowAddForm(false);

      await fetchSuppliers();
    } catch (error) {
      console.error(
        'Error adding supplier:',
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
          'Failed to add supplier',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // EDIT SUPPLIER
  // =========================================================

  const openEditSupplier = (supplier) => {
    setEditingSupplier(supplier);

    setEditForm({
      name: supplier.name || '',
      location: supplier.location || '',
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

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();

    if (!editForm.name.trim()) {
      setMessage(
        'Supplier name is required',
      );
      return;
    }

    if (!editingSupplier) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await api.patch(
        `/suppliers/${editingSupplier._id}`,
        {
          name: editForm.name.trim(),
          location:
            editForm.location.trim(),
        },
      );

      setMessage(
        'Supplier updated successfully',
      );

      setEditingSupplier(null);

      await fetchSuppliers();
    } catch (error) {
      console.error(
        'Error updating supplier:',
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
          'Failed to update supplier',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // ACTIVATE / DEACTIVATE SUPPLIER
  // =========================================================

  const handleToggleSupplier = async (
    supplier,
  ) => {
    try {
      setLoading(true);
      setMessage('');

      await api.patch(
        `/suppliers/${supplier._id}`,
        {
          isActive: !supplier.isActive,
        },
      );

      setMessage(
        supplier.isActive
          ? 'Supplier deactivated successfully'
          : 'Supplier activated successfully',
      );

      await fetchSuppliers();
    } catch (error) {
      console.error(
        'Error updating supplier status:',
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
          'Failed to update supplier status',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // DELETE SUPPLIER
  // =========================================================

  const handleDeleteSupplier = async (
    supplier,
  ) => {
    const balance = Number(
      supplier.balance ?? 0,
    );

    if (balance !== 0) {
      setMessage(
        balance > 0
          ? 'Supplier cannot be deleted while a payable balance exists. Clear the balance first.'
          : 'Supplier cannot be deleted while an advance exists. Use the advance against future purchases first.',
      );

      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${supplier.name}?`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await api.delete(
        `/suppliers/${supplier._id}`,
      );

      setMessage(
        'Supplier deleted successfully',
      );

      await fetchSuppliers();
    } catch (error) {
      console.error(
        'Error deleting supplier:',
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
          'Failed to delete supplier',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LEDGER
  // =========================================================

  const openLedger = async (supplier) => {
    setSelectedSupplier(supplier);
    setShowLedger(true);
    setLedgerLoading(true);
    setLedgerTransactions([]);
    setLedgerBalance(null);
    setMessage('');

    try {
      const response = await api.get(
        `/suppliers/${supplier._id}/ledger`,
      );

      const supplierData =
        response.data?.supplier;

      const currentBalance =
        response.data?.currentBalance ??
        supplierData?.balance ??
        supplier.balance ??
        0;

      setLedgerTransactions(
        response.data?.transactions || [],
      );

      setLedgerBalance(
        currentBalance,
      );

      if (supplierData) {
        setSelectedSupplier(
          supplierData,
        );
      }
    } catch (error) {
      console.error(
        'Error fetching supplier ledger:',
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
          'Failed to load supplier ledger',
      );
    } finally {
      setLedgerLoading(false);
    }
  };

  const closeLedger = () => {
    setShowLedger(false);
    setSelectedSupplier(null);
    setLedgerTransactions([]);
    setLedgerBalance(null);
  };

  // =========================================================
  // TRANSACTION DETAILS
  // =========================================================

  const openTransactionDetails = (
    transaction,
  ) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const closeTransactionDetails = () => {
    setShowTransactionDetails(false);
    setSelectedTransaction(null);
  };

  // =========================================================
  // PRODUCTS
  // =========================================================

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);

      const response = await api.get(
        '/products',
      );

      setProducts(response.data || []);
    } catch (error) {
      console.error(
        'Error fetching products:',
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
          'Failed to load products',
      );
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (showPurchaseModal || showReturnModal) {
      fetchProducts();
    }
  }, [showPurchaseModal, showReturnModal]);

  const filteredProducts = useMemo(() => {
    const search =
      productSearch
        .trim()
        .toLowerCase();

    if (!search) {
      return products;
    }

    return products.filter((product) => {
      const dressName =
        product.dressName
          ?.toLowerCase() || '';

      const category =
        product.category
          ?.toLowerCase() || '';

      const brand =
        product.brand
          ?.toLowerCase() || '';

      const size =
        product.size
          ?.toLowerCase() || '';

      const color =
        product.color
          ?.toLowerCase() || '';

      return (
        dressName.includes(search) ||
        category.includes(search) ||
        brand.includes(search) ||
        size.includes(search) ||
        color.includes(search)
      );
    });
  }, [
    products,
    productSearch,
  ]);

  const filteredReturnProducts = useMemo(() => {
    const search =
      returnProductSearch
        .trim()
        .toLowerCase();

    if (!search) {
      return products;
    }

    return products.filter((product) => {
      const dressName =
        product.dressName
          ?.toLowerCase() || '';

      const category =
        product.category
          ?.toLowerCase() || '';

      const brand =
        product.brand
          ?.toLowerCase() || '';

      const size =
        product.size
          ?.toLowerCase() || '';

      const color =
        product.color
          ?.toLowerCase() || '';

      return (
        dressName.includes(search) ||
        category.includes(search) ||
        brand.includes(search) ||
        size.includes(search) ||
        color.includes(search)
      );
    });
  }, [
    products,
    returnProductSearch,
  ]);

  // =========================================================
  // PURCHASE MODAL
  // =========================================================

  const openPurchaseModal = (
    supplier,
  ) => {
    setPurchaseSupplier(supplier);
    setPurchaseItems([]);
    setPurchaseNote('');
    setProductSearch('');
    setCurrentDateTime(new Date());
    setShowPurchaseModal(true);
    setMessage('');
  };

  const closePurchaseModal = () => {
    setShowPurchaseModal(false);
    setPurchaseSupplier(null);
    setPurchaseItems([]);
    setPurchaseNote('');
    setProductSearch('');
  };

  const addProductToPurchase = (
    product,
  ) => {
    const alreadyAdded =
      purchaseItems.some(
        (item) =>
          item.productId ===
          product._id,
      );

    if (alreadyAdded) {
      setMessage(
        'This product is already added to the purchase',
      );
      return;
    }

    setPurchaseItems((prev) => [
      ...prev,
      {
        productId: product._id,
        dressName:
          product.dressName || '',
        brand:
          product.brand || '',
        category:
          product.category || '',
        size:
          product.size || '',
        color:
          product.color || '',
        quantity: 1,
        purchasePrice: Number(
          product.purchasePrice || 0,
        ),
      },
    ]);

    setProductSearch('');
    setMessage('');
  };

  const updatePurchaseItem = (
    productId,
    field,
    value,
  ) => {
    setPurchaseItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
            ...item,
            [field]: value,
          }
          : item,
      ),
    );
  };

  const removePurchaseItem = (
    productId,
  ) => {
    setPurchaseItems((prev) =>
      prev.filter(
        (item) =>
          item.productId !==
          productId,
      ),
    );
  };

  const purchaseTotal = useMemo(() => {
    return purchaseItems.reduce(
      (total, item) => {
        const quantity =
          Number(item.quantity) || 0;

        const price =
          Number(
            item.purchasePrice,
          ) || 0;

        return (
          total +
          quantity * price
        );
      },
      0,
    );
  }, [purchaseItems]);

  const handleCreatePurchase = async (
    e,
  ) => {
    e.preventDefault();

    if (!purchaseSupplier) {
      return;
    }

    if (
      purchaseItems.length === 0
    ) {
      setMessage(
        'Please add at least one product',
      );
      return;
    }

    const invalidItem =
      purchaseItems.find(
        (item) => {
          const quantity =
            Number(item.quantity);

          const purchasePrice =
            Number(item.purchasePrice);

          return (
            !Number.isFinite(quantity) ||
            quantity <= 0 ||
            !Number.isFinite(
              purchasePrice,
            ) ||
            purchasePrice < 0
          );
        },
      );

    if (invalidItem) {
      setMessage(
        'Please enter valid quantity and purchase price for all products',
      );
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const payload = {
        items: purchaseItems.map(
          (item) => ({
            productId:
              item.productId,
            quantity:
              Number(
                item.quantity,
              ),
            purchasePrice:
              Number(
                item.purchasePrice,
              ),
          }),
        ),
      };

      if (
        purchaseNote.trim()
      ) {
        payload.note =
          purchaseNote.trim();
      }

      await api.post(
        `/suppliers/${purchaseSupplier._id}/purchases`,
        payload,
      );

      closePurchaseModal();

      await fetchSuppliers();

      if (
        selectedSupplier &&
        selectedSupplier._id ===
        purchaseSupplier._id
      ) {
        const freshSupplier =
          await api.get(
            `/suppliers/${purchaseSupplier._id}`,
          );

        await openLedger(
          freshSupplier.data,
        );
      }

      setMessage(
        'Purchase recorded successfully',
      );
    } catch (error) {
      console.error(
        'Error creating purchase:',
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
          'Failed to record purchase',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // PAYMENT MODAL
  // =========================================================

  const openPaymentModal = (
    supplier,
  ) => {
    setPaymentSupplier(supplier);

    setPaymentForm({
      amount: '',
      paymentMethod: 'cash',
      note: '',
    });

    setCurrentDateTime(new Date());
    setShowPaymentModal(true);
    setMessage('');
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentSupplier(null);

    setPaymentForm({
      amount: '',
      paymentMethod: 'cash',
      note: '',
    });
  };

  const handlePaymentFormChange = (
    e,
  ) => {
    const { name, value } = e.target;

    setPaymentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreatePayment = async (
    e,
  ) => {
    e.preventDefault();

    if (!paymentSupplier) {
      return;
    }

    const amount = Number(
      paymentForm.amount,
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setMessage(
        'Payment amount must be greater than 0',
      );
      return;
    }

    try {
      setPaymentLoading(true);
      setMessage('');

      const payload = {
        amount,
        paymentMethod:
          paymentForm.paymentMethod,
      };

      if (
        paymentForm.note.trim()
      ) {
        payload.note =
          paymentForm.note.trim();
      }

      await api.post(
        `/suppliers/${paymentSupplier._id}/payments`,
        payload,
      );

      closePaymentModal();

      await fetchSuppliers();

      if (
        selectedSupplier &&
        selectedSupplier._id ===
        paymentSupplier._id
      ) {
        const freshSupplier =
          await api.get(
            `/suppliers/${paymentSupplier._id}`,
          );

        await openLedger(
          freshSupplier.data,
        );
      }

      setMessage(
        'Payment recorded successfully',
      );
    } catch (error) {
      console.error(
        'Error creating payment:',
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
          'Failed to record payment',
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // =========================================================
  // RETURN MODAL
  // =========================================================

  const openReturnModal = (supplier) => {
    setReturnSupplier(supplier);
    setReturnItems([]);
    setReturnNote('');
    setReturnProductSearch('');
    setCurrentDateTime(new Date());
    setShowReturnModal(true);
    setMessage('');
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setReturnSupplier(null);
    setReturnItems([]);
    setReturnNote('');
    setReturnProductSearch('');
  };

  const addProductToReturn = (product) => {
    const alreadyAdded =
      returnItems.some(
        (item) =>
          item.productId === product._id,
      );

    if (alreadyAdded) {
      setMessage(
        'This product is already added to the return',
      );
      return;
    }

    const availableStock = Number(
      product.stockQuantity ?? 0,
    );

    if (availableStock <= 0) {
      setMessage(
        `${product.dressName} has no stock available to return`,
      );
      return;
    }

    setReturnItems((prev) => [
      ...prev,
      {
        productId: product._id,
        dressName:
          product.dressName || '',
        brand:
          product.brand || '',
        category:
          product.category || '',
        size:
          product.size || '',
        color:
          product.color || '',
        quantity: 1,
        returnPrice: Number(
          product.purchasePrice || 0,
        ),
        availableStock,
      },
    ]);

    setReturnProductSearch('');
    setMessage('');
  };

  const updateReturnItem = (
    productId,
    field,
    value,
  ) => {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
            ...item,
            [field]: value,
          }
          : item,
      ),
    );
  };

  const removeReturnItem = (productId) => {
    setReturnItems((prev) =>
      prev.filter(
        (item) =>
          item.productId !== productId,
      ),
    );
  };

  const returnTotal = useMemo(() => {
    return returnItems.reduce(
      (total, item) => {
        const quantity =
          Number(item.quantity) || 0;

        const price =
          Number(item.returnPrice) || 0;

        return total + quantity * price;
      },
      0,
    );
  }, [returnItems]);

  const handleCreateReturn = async (e) => {
    e.preventDefault();

    if (!returnSupplier) {
      return;
    }

    if (returnItems.length === 0) {
      setMessage(
        'Please add at least one product to return',
      );
      return;
    }

    const invalidItem =
      returnItems.find((item) => {
        const quantity =
          Number(item.quantity);

        const returnPrice =
          Number(item.returnPrice);

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          !Number.isFinite(returnPrice) ||
          returnPrice < 0
        ) {
          return true;
        }

        if (
          Number.isFinite(item.availableStock) &&
          quantity > item.availableStock
        ) {
          return true;
        }

        return false;
      });

    if (invalidItem) {
      if (
        Number.isFinite(invalidItem.availableStock) &&
        Number(invalidItem.quantity) >
        invalidItem.availableStock
      ) {
        setMessage(
          `Return quantity for ${invalidItem.dressName} exceeds available stock (${invalidItem.availableStock}).`,
        );
      } else {
        setMessage(
          'Please enter valid quantity and return price for all products',
        );
      }
      return;
    }

    try {
      setReturnLoading(true);
      setMessage('');

      const payload = {
        items: returnItems.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          returnPrice: Number(item.returnPrice),
        })),
      };

      if (returnNote.trim()) {
        payload.note = returnNote.trim();
      }

      await api.post(
        `/suppliers/${returnSupplier._id}/returns`,
        payload,
      );

      closeReturnModal();

      await fetchSuppliers();

      if (
        selectedSupplier &&
        selectedSupplier._id ===
        returnSupplier._id
      ) {
        const freshSupplier =
          await api.get(
            `/suppliers/${returnSupplier._id}`,
          );

        await openLedger(
          freshSupplier.data,
        );
      }

      setMessage(
        'Return recorded successfully',
      );
    } catch (error) {
      console.error(
        'Error creating return:',
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
          'Failed to record return',
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
          <h1>Suppliers</h1>

          <p>
            Manage suppliers, purchases,
            returns, payments and supplier ledgers.
          </p>
        </div>

        <button
          className="add-supplier-btn"
          onClick={() =>
            setShowAddForm(
              !showAddForm,
            )
          }
        >
          {showAddForm
            ? 'Close'
            : '+ Add Supplier'}
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
          ADD SUPPLIER
      ====================================================== */}

      {showAddForm && (
        <div className="supplier-form-card">
          <div className="supplier-form-header">
            <h2>Add Supplier</h2>
          </div>

          <form onSubmit={handleAddSupplier}>
            <div className="supplier-form-grid">

              <div className="form-group">
                <label>Supplier Name</label>

                <input
                  type="text"
                  name="name"
                  value={supplierForm.name}
                  onChange={handleSupplierFormChange}
                  placeholder="Enter supplier name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Location / Address</label>

                <input
                  type="text"
                  name="location"
                  value={supplierForm.location}
                  onChange={handleSupplierFormChange}
                  placeholder="Enter supplier location"
                />
              </div>

              <div className="form-group">
                <label>Opening Balance</label>

                <input
                  type="number"
                  name="openingBalance"
                  value={supplierForm.openingBalance}
                  onChange={handleSupplierFormChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />

                <small>
                  Optional. This is the initial amount owed to the supplier.
                </small>
              </div>

            </div>

            <div className="supplier-form-actions">
              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Supplier'}
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
          SUPPLIERS TABLE & SEARCH BAR
      ====================================================== */}

      <div className="suppliers-table-card">

        <div className="suppliers-table-header">
          <div>
            <h2>Supplier List</h2>

            <span>
              {filteredSuppliers.length} supplier
              {filteredSuppliers.length !== 1 ? 's' : ''}
              {searchTerm && ` (filtered from ${suppliers.length})`}
            </span>
          </div>

{/* SEARCH BAR (Matching Sales Page Structure) */}
<div className="sales-search">
  <input
    type="text"
    placeholder="Search supplier name or location..."
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

        {loading && suppliers.length === 0 ? (
          <div className="supplier-loading">Loading suppliers...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="supplier-empty">
            <h3>No suppliers found</h3>

            <p>
              {searchTerm
                ? 'No supplier matches your search criteria.'
                : 'Add your first supplier to start managing purchases and payments.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="suppliers-table">
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
                {filteredSuppliers.map((supplier) => {
                  const balanceStatus = getBalanceStatus(supplier.balance);

                  return (
                    <tr key={supplier._id}>
                      <td>
                        <div className="supplier-name-cell">
                          <strong>{supplier.name}</strong>
                        </div>
                      </td>

                      <td>{supplier.location || '-'}</td>

                      {/* BALANCE */}
                      <td>
                        <div className="supplier-balance-display">
                          <strong className={`supplier-balance ${balanceStatus.type}`}>
                            {formatBalance(supplier.balance)}
                          </strong>

                          <small className={`supplier-balance-label ${balanceStatus.type}`}>
                            {balanceStatus.label}
                          </small>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className={`supplier-status ${supplier.isActive ? 'active' : 'inactive'
                            }`}
                        >
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="supplier-actions">
                          <button
                            className="action-btn ledger-btn"
                            onClick={() => openLedger(supplier)}
                          >
                            Ledger
                          </button>

                          <button
                            className="action-btn purchase-btn"
                            onClick={() => openPurchaseModal(supplier)}
                            disabled={!supplier.isActive}
                          >
                            Purchase
                          </button>

                          <button
                            className="action-btn return-btn"
                            onClick={() => openReturnModal(supplier)}
                            disabled={!supplier.isActive}
                          >
                            Return
                          </button>

                          <button
                            className="action-btn payment-btn"
                            onClick={() => openPaymentModal(supplier)}
                            disabled={!supplier.isActive}
                          >
                            Payment
                          </button>

                          <button
                            className="action-btn edit-btn"
                            onClick={() => openEditSupplier(supplier)}
                          >
                            Edit
                          </button>

                          <button
                            className="action-btn toggle-btn"
                            onClick={() => handleToggleSupplier(supplier)}
                          >
                            {supplier.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          {Number(supplier.balance ?? 0) === 0 && (
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteSupplier(supplier)}
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

              {/* Supplier Balance Total Summary Footer */}
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
          EDIT SUPPLIER MODAL
      ====================================================== */}

      {editingSupplier && (
        <div className="modal-overlay">
          <div className="supplier-modal">
            <div className="modal-header">
              <div>
                <h2>Edit Supplier</h2>
                <p>Update supplier information</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setEditingSupplier(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateSupplier}>
              <div className="form-group">
                <label>Supplier Name</label>

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
                  placeholder="Supplier location"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingSupplier(null)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          LEDGER MODAL
      ====================================================== */}

      {showLedger && selectedSupplier && (
        <div className="modal-overlay">
          <div className="supplier-ledger-modal">
            <div className="modal-header">
              <div>
                <h2>{selectedSupplier.name} Ledger</h2>
                <p>{selectedSupplier.location || 'No location added'}</p>
              </div>

              <button className="modal-close" onClick={closeLedger}>
                ×
              </button>
            </div>

            {/* CURRENT BALANCE */}
            <div className="supplier-ledger-summary">
              {(() => {
                const status = getBalanceStatus(
                  ledgerBalance ?? selectedSupplier.balance ?? 0
                );

                return (
                  <div className="supplier-ledger-summary-card">
                    <span>{status.label}</span>

                    <strong className={`ledger-current-balance ${status.type}`}>
                      {formatBalance(
                        ledgerBalance ?? selectedSupplier.balance ?? 0
                      )}
                    </strong>

                    <small>
                      {status.type === 'payable'
                        ? 'Amount payable to supplier'
                        : status.type === 'advance'
                          ? 'Advance with supplier'
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
                onClick={() => openPurchaseModal(selectedSupplier)}
                disabled={!selectedSupplier.isActive}
              >
                + Purchase
              </button>

              <button
                className="action-btn return-btn"
                onClick={() => openReturnModal(selectedSupplier)}
                disabled={!selectedSupplier.isActive}
              >
                + Return
              </button>

              <button
                className="action-btn payment-btn"
                onClick={() => openPaymentModal(selectedSupplier)}
                disabled={!selectedSupplier.isActive}
              >
                + Payment
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
                    No purchases, returns or payments have been recorded for this supplier.
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
                                {getTransactionTypeLabel(transaction.type)}
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
                  {getTransactionTypeLabel(selectedTransaction.type)} transaction
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
                <span>Supplier Location</span>

                <strong>
                  {selectedTransaction.supplierLocation ||
                    'No location recorded'}
                </strong>
              </div>

              <div>
                <span>Type</span>

                <strong>
                  {getTransactionTypeLabel(selectedTransaction.type)}
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

            {(selectedTransaction.type === 'purchase' ||
              selectedTransaction.type === 'return') &&
              selectedTransaction.items &&
              selectedTransaction.items.length > 0 && (
                <div className="transaction-items-section">
                  <h3>
                    {selectedTransaction.type === 'return'
                      ? 'Returned Dresses'
                      : 'Purchased Dresses'}
                  </h3>

                  <div className="table-responsive">
                    <table className="transaction-items-table">
                      <thead>
                        <tr>
                          <th>Dress</th>
                          <th>Brand</th>
                          <th>Size</th>
                          <th>Color</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedTransaction.items.map((item, index) => (
                          <tr key={item.productId || item.product || index}>
                            <td>{item.dressName}</td>
                            <td>{item.brand || '-'}</td>
                            <td>{item.size || '-'}</td>
                            <td>{item.color || '-'}</td>
                            <td>{item.quantity}</td>
                            <td>
                              {formatAmount(
                                item.purchasePrice ?? item.price ?? 0
                              )}
                            </td>
                            <td>
                              {formatAmount(
                                item.subtotal ??
                                Number(item.quantity || 0) *
                                Number(
                                  item.purchasePrice ?? item.price ?? 0
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
          PURCHASE MODAL
      ====================================================== */}

      {showPurchaseModal && purchaseSupplier && (
        <div className="modal-overlay">
          <div className="purchase-modal">
            <div className="modal-header">
              <div>
                <h2>Record Purchase</h2>

                <p>
                  Supplier: <strong>{purchaseSupplier.name}</strong>
                </p>
              </div>

              <button className="modal-close" onClick={closePurchaseModal}>
                ×
              </button>
            </div>

            <div className="purchase-details-grid">
              <div className="form-group">
                <label>Transaction Date & Time</label>

                <input
                  type="text"
                  value={formatDateTime(currentDateTime)}
                  readOnly
                />

                <small>
                  Automatically recorded when you submit this purchase.
                </small>
              </div>
            </div>

            <div className="purchase-product-search">
              <label>Search Product</label>

              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search by dress name, category, brand, size or color..."
              />

              {productSearch && (
                <div className="product-search-results">
                  {productsLoading ? (
                    <div className="product-search-loading">
                      Loading products...
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="product-search-empty">
                      No products found
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        type="button"
                        className="product-search-item"
                        key={product._id}
                        onClick={() => addProductToPurchase(product)}
                      >
                        <div>
                          <strong>{product.dressName}</strong>
                          <span>
                            {product.brand || '-'} • {product.category || '-'}
                          </span>
                        </div>

                        <div>
                          <span>Size: {product.size || '-'}</span>
                          <span>Color: {product.color || '-'}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="purchase-items-section">
              <div className="purchase-items-header">
                <h3>Purchase Items</h3>
                <span>
                  {purchaseItems.length} item
                  {purchaseItems.length !== 1 ? 's' : ''}
                </span>
              </div>

              {purchaseItems.length === 0 ? (
                <div className="purchase-empty">
                  Search and select products above to add them to this purchase.
                </div>
              ) : (
                <div className="purchase-items-list">
                  {purchaseItems.map((item) => (
                    <div className="purchase-item-row" key={item.productId}>
                      <div className="purchase-item-info">
                        <strong>{item.dressName}</strong>
                        <span>
                          {item.brand || '-'} • {item.size || '-'} •{' '}
                          {item.color || '-'}
                        </span>
                      </div>

                      <div className="purchase-item-field">
                        <label>Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updatePurchaseItem(
                              item.productId,
                              'quantity',
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="purchase-item-field">
                        <label>Purchase Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.purchasePrice}
                          onChange={(e) =>
                            updatePurchaseItem(
                              item.productId,
                              'purchasePrice',
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="purchase-item-subtotal">
                        <span>Subtotal</span>
                        <strong>
                          {formatAmount(
                            Number(item.quantity || 0) *
                            Number(item.purchasePrice || 0)
                          )}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="remove-purchase-item"
                        onClick={() => removePurchaseItem(item.productId)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="purchase-details-grid">
              <div className="form-group">
                <label>Note</label>

                <input
                  type="text"
                  value={purchaseNote}
                  onChange={(e) => setPurchaseNote(e.target.value)}
                  placeholder="Optional note"
                />
              </div>
            </div>

            <div className="purchase-total">
              <span>Total Purchase</span>
              <strong>{formatAmount(purchaseTotal)}</strong>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={closePurchaseModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={handleCreatePurchase}
                disabled={loading || purchaseItems.length === 0}
              >
                {loading ? 'Saving...' : 'Record Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          RETURN MODAL
      ====================================================== */}

      {showReturnModal && returnSupplier && (
        <div className="modal-overlay">
          <div className="purchase-modal">
            <div className="modal-header">
              <div>
                <h2>Record Return</h2>

                <p>
                  Supplier: <strong>{returnSupplier.name}</strong>
                </p>
              </div>

              <button className="modal-close" onClick={closeReturnModal}>
                ×
              </button>
            </div>

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

            <div className="purchase-product-search">
              <label>Search Product</label>

              <input
                type="text"
                value={returnProductSearch}
                onChange={(e) =>
                  setReturnProductSearch(e.target.value)
                }
                placeholder="Search by dress name, category, brand, size or color..."
              />

              {returnProductSearch && (
                <div className="product-search-results">
                  {productsLoading ? (
                    <div className="product-search-loading">
                      Loading products...
                    </div>
                  ) : filteredReturnProducts.length === 0 ? (
                    <div className="product-search-empty">
                      No products found
                    </div>
                  ) : (
                    filteredReturnProducts.map((product) => {
                      const availableStock = Number(
                        product.stockQuantity ?? 0,
                      );

                      return (
                        <button
                          type="button"
                          className="product-search-item"
                          key={product._id}
                          onClick={() => addProductToReturn(product)}
                          disabled={availableStock <= 0}
                        >
                          <div>
                            <strong>{product.dressName}</strong>
                            <span>
                              {product.brand || '-'} • {product.category || '-'}
                            </span>
                          </div>

                          <div>
                            <span>Size: {product.size || '-'}</span>
                            <span>Color: {product.color || '-'}</span>
                            <span>Stock: {availableStock}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="purchase-items-section">
              <div className="purchase-items-header">
                <h3>Return Items</h3>
                <span>
                  {returnItems.length} item
                  {returnItems.length !== 1 ? 's' : ''}
                </span>
              </div>

              {returnItems.length === 0 ? (
                <div className="purchase-empty">
                  Search and select products above to add them to this return.
                </div>
              ) : (
                <div className="purchase-items-list">
                  {returnItems.map((item) => (
                    <div className="purchase-item-row" key={item.productId}>
                      <div className="purchase-item-info">
                        <strong>{item.dressName}</strong>
                        <span>
                          {item.brand || '-'} • {item.size || '-'} •{' '}
                          {item.color || '-'}
                        </span>
                        <span>
                          Available stock: {item.availableStock}
                        </span>
                      </div>

                      <div className="purchase-item-field">
                        <label>Qty</label>
                        <input
                          type="number"
                          min="1"
                          max={item.availableStock}
                          value={item.quantity}
                          onChange={(e) =>
                            updateReturnItem(
                              item.productId,
                              'quantity',
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="purchase-item-field">
                        <label>Return Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.returnPrice}
                          onChange={(e) =>
                            updateReturnItem(
                              item.productId,
                              'returnPrice',
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="purchase-item-subtotal">
                        <span>Subtotal</span>
                        <strong>
                          {formatAmount(
                            Number(item.quantity || 0) *
                            Number(item.returnPrice || 0),
                          )}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="remove-purchase-item"
                        onClick={() => removeReturnItem(item.productId)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="purchase-details-grid">
              <div className="form-group">
                <label>Note</label>

                <input
                  type="text"
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  placeholder="Optional note"
                />
              </div>
            </div>

            <div className="purchase-total">
              <span>Total Return</span>
              <strong>{formatAmount(returnTotal)}</strong>
            </div>

            <div className="payment-info">
              Returning dresses will reduce the supplier balance and decrease
              stock. If the return total exceeds the current payable balance,
              the remainder becomes an advance with the supplier.
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
                type="button"
                className="primary-btn"
                onClick={handleCreateReturn}
                disabled={returnLoading || returnItems.length === 0}
              >
                {returnLoading ? 'Saving...' : 'Record Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PAYMENT MODAL
      ====================================================== */}

      {showPaymentModal && paymentSupplier && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <div>
                <h2>Record Payment</h2>

                <p>
                  Supplier: <strong>{paymentSupplier.name}</strong>
                </p>
              </div>

              <button className="modal-close" onClick={closePaymentModal}>
                ×
              </button>
            </div>

            {(() => {
              const status = getBalanceStatus(paymentSupplier.balance ?? 0);

              return (
                <div className="payment-current-balance">
                  <span>Current {status.label}</span>

                  <strong className={status.type}>
                    {formatBalance(paymentSupplier.balance ?? 0)}
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
                  Automatically recorded when you submit this payment.
                </small>
              </div>
            </div>

            <form onSubmit={handleCreatePayment}>
              <div className="form-group">
                <label>Payment Amount</label>

                <input
                  type="number"
                  name="amount"
                  value={paymentForm.amount}
                  onChange={handlePaymentFormChange}
                  placeholder="Enter payment amount"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>

                <select
                  name="paymentMethod"
                  value={paymentForm.paymentMethod}
                  onChange={handlePaymentFormChange}
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
                  value={paymentForm.note}
                  onChange={handlePaymentFormChange}
                  placeholder="Optional note"
                />
              </div>

              <div className="payment-info">
                Payment will reduce the supplier's outstanding balance. If you pay
                more than the current balance, the extra amount will be recorded as
                a supplier advance and will automatically be adjusted against
                future purchases.
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closePaymentModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Suppliers;