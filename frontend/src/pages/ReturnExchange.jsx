import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import '../styles/ReturnExchange.css';

function ReturnExchange() {
  // =========================================================
  // STATE
  // =========================================================

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [sale, setSale] = useState(null);

  // Original sale used for completed receipt
  const [completedOriginalSale, setCompletedOriginalSale] =
    useState(null);

  const [products, setProducts] = useState([]);

  // Previous return/exchange transactions
  const [returnExchangeHistory, setReturnExchangeHistory] =
    useState([]);

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Complete returns
  const [returnedItems, setReturnedItems] = useState([]);

  // Exchanges
  const [exchangeItems, setExchangeItems] = useState([]);

  // Current exchange builder
  const [exchangeReturnProductId, setExchangeReturnProductId] =
    useState('');

  const [exchangeReturnQuantity, setExchangeReturnQuantity] =
    useState(1);

  // Temporary replacement rows
  const [replacementRows, setReplacementRows] = useState([
    {
      id: Date.now(),
      productId: '',
      quantity: 1,
      search: '',
    },
  ]);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');

  // Completed transaction shown on receipt
  const [completedTransaction, setCompletedTransaction] =
    useState(null);

  // =========================================================
  // HELPERS
  // =========================================================

  const getId = (value) => {
    if (!value) return '';

    if (typeof value === 'string') return value;

    if (value._id) return String(value._id);

    if (value.$oid) return String(value.$oid);

    return String(value);
  };

  // =========================================================
  // FLEXIBLE INVOICE NORMALIZATION
  //
  // Examples:
  // 11           -> INV-00011
  // INV11        -> INV-00011
  // inv-11       -> INV-00011
  // INV-00011    -> INV-00011
  // 00011        -> INV-00011
  // =========================================================

  const normalizeInvoiceNumber = (value) => {
    const cleaned = String(value || '')
      .trim()
      .toUpperCase();

    if (!cleaned) return '';

    // Remove INV prefix if supplied
    let digits = cleaned.replace(
      /^INV\s*[-:#]?\s*/i,
      '',
    );

    // Keep only numeric portion
    digits = digits.replace(/\D/g, '');

    if (!digits) {
      return cleaned;
    }

    return `INV-${digits.padStart(5, '0')}`;
  };

  const getSalePrice = (product) => {
    if (!product) return 0;

    const actualPrice = Number(product.actualPrice || 0);
    const discount = Number(product.discount || 0);

    return (
      actualPrice -
      (actualPrice * discount) / 100
    );
  };

  const getReceiptPrice = (item) => {
    if (!item) return 0;

    if (
      item.price !== undefined &&
      item.price !== null
    ) {
      return Number(item.price);
    }

    if (
      item.actualPrice !== undefined &&
      item.actualPrice !== null
    ) {
      const actualPrice = Number(
        item.actualPrice || 0,
      );

      const discount = Number(
        item.discount || 0,
      );

      return (
        actualPrice -
        (actualPrice * discount) / 100
      );
    }

    return 0;
  };

  const findSaleItem = (productId) => {
    if (!sale?.items) return null;

    const id = getId(productId);

    return sale.items.find(
      (item) =>
        getId(
          item.productId ||
            item.product ||
            item._id,
        ) === id,
    );
  };

  const findProduct = (productId) => {
    const id = getId(productId);

    return products.find(
      (product) => getId(product._id) === id,
    );
  };

  const getProductName = (productId) => {
    const product = findProduct(productId);

    if (product) return product.dressName;

    const saleItem = findSaleItem(productId);

    return (
      saleItem?.dressName ||
      saleItem?.productName ||
      saleItem?.name ||
      'Unknown Dress'
    );
  };

  const getProductPrice = (productId) => {
    const product = findProduct(productId);

    if (product) {
      return getSalePrice(product);
    }

    const saleItem = findSaleItem(productId);

    return getReceiptPrice(saleItem);
  };

  const getProductStock = (productId) => {
    const product = findProduct(productId);

    return Number(
      product?.stockQuantity || 0,
    );
  };

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.products || [];

      setProducts(data);
    } catch (error) {
      console.error(
        'PRODUCT LOAD ERROR:',
        error,
      );
    }
  };

  // =========================================================
  // LOAD RETURN / EXCHANGE HISTORY
  // =========================================================

  const loadReturnExchangeHistory = async (
    currentInvoice,
  ) => {
    try {
      const response = await api.get(
        '/sales/return-exchanges/all',
      );

      const allTransactions = Array.isArray(
        response.data,
      )
        ? response.data
        : response.data?.transactions ||
          response.data?.returnExchanges ||
          response.data?.data ||
          [];

      const normalizedInvoice =
        normalizeInvoiceNumber(currentInvoice);

      const filtered =
        allTransactions.filter(
          (transaction) => {
            const transactionInvoice =
              normalizeInvoiceNumber(
                transaction.originalInvoiceNumber ||
                  transaction.invoiceNumber ||
                  transaction.originalInvoice,
              );

            return (
              transactionInvoice ===
              normalizedInvoice
            );
          },
        );

      setReturnExchangeHistory(filtered);

      return filtered;
    } catch (error) {
      console.error(
        'RETURN/EXCHANGE HISTORY LOAD ERROR:',
        error,
      );

      setReturnExchangeHistory([]);

      return [];
    }
  };

  // =========================================================
  // SEARCH INVOICE
  // =========================================================

  const searchInvoice = async () => {
    const normalizedInvoice =
      normalizeInvoiceNumber(invoiceNumber);

    if (!normalizedInvoice) {
      setMessage(
        'Please enter an invoice number.',
      );
      setMessageType('error');
      return;
    }

    setSearching(true);
    setMessage('');
    setMessageType('');

    setReturnedItems([]);
    setExchangeItems([]);
    setExchangeReturnProductId('');
    setExchangeReturnQuantity(1);
    resetReplacementRows();

    try {
      const response = await api.get(
        `/sales/invoice/${encodeURIComponent(
          normalizedInvoice,
        )}`,
      );

      const foundSale =
        response.data?.sale ||
        response.data?.data ||
        response.data;

      if (!foundSale) {
        throw new Error(
          'Invoice not found.',
        );
      }

      setSale(foundSale);

      // Show normalized invoice in input
      setInvoiceNumber(normalizedInvoice);

      // Load history separately
      await loadReturnExchangeHistory(
        normalizedInvoice,
      );

      setMessage(
        'Invoice found successfully.',
      );
      setMessageType('success');
    } catch (error) {
      console.error(
        'INVOICE SEARCH ERROR:',
        error,
      );

      console.error(
        'BACKEND RESPONSE:',
        error?.response?.data,
      );

      setSale(null);
      setReturnExchangeHistory([]);

      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          'Invoice not found.',
      );

      setMessageType('error');
    } finally {
      setSearching(false);
    }
  };

  // =========================================================
  // ENTER KEY
  // =========================================================

  const handleInvoiceKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchInvoice();
    }
  };

  // =========================================================
  // SOLD QUANTITY
  // =========================================================

  const getSoldQuantity = (productId) => {
    const item = findSaleItem(productId);

    return Number(
      item?.quantity ||
        item?.soldQuantity ||
        0,
    );
  };

  // =========================================================
  // PROCESSED QUANTITY
  // =========================================================

  const getProcessedQuantity = (
    productId,
  ) => {
    const id = getId(productId);

    if (
      !id ||
      !Array.isArray(
        returnExchangeHistory,
      )
    ) {
      return 0;
    }

    let processedQuantity = 0;

    for (const transaction of returnExchangeHistory) {
      // -----------------------------------------------------
      // Complete returns
      // -----------------------------------------------------

      if (
        Array.isArray(
          transaction.returnedItems,
        )
      ) {
        for (const item of transaction.returnedItems) {
          const returnedId = getId(
            item.productId ||
              item.product ||
              item._id,
          );

          if (returnedId === id) {
            processedQuantity += Number(
              item.quantity || 0,
            );
          }
        }
      }

      // -----------------------------------------------------
      // Exchanges
      // -----------------------------------------------------

      if (
        Array.isArray(
          transaction.exchangeItems,
        )
      ) {
        for (const exchange of transaction.exchangeItems) {
          const returnedId = getId(
            exchange.returnedProductId ||
              exchange.returnedProduct ||
              exchange.productId,
          );

          if (returnedId === id) {
            processedQuantity += Number(
              exchange.returnedQuantity || 0,
            );
          }
        }
      }
    }

    return processedQuantity;
  };

  // =========================================================
  // AVAILABLE QUANTITY
  // =========================================================

  const getAvailableReturnQuantity = (
    productId,
  ) => {
    const sold =
      getSoldQuantity(productId);

    const processed =
      getProcessedQuantity(productId);

    return Math.max(
      0,
      sold - processed,
    );
  };

  // =========================================================
  // STATUS
  // =========================================================

  const getItemStatus = (productId) => {
    const sold =
      getSoldQuantity(productId);

    const processed =
      getProcessedQuantity(productId);

    const remaining = Math.max(
      0,
      sold - processed,
    );

    if (
      remaining <= 0 &&
      sold > 0
    ) {
      return 'fully-processed';
    }

    if (
      processed > 0 &&
      remaining > 0
    ) {
      return 'partially-processed';
    }

    return 'available';
  };

  // =========================================================
  // LOCAL RETURN QUANTITY
  // =========================================================

  const getLocallySelectedReturnQuantity = (
    productId,
  ) => {
    const id = getId(productId);

    return returnedItems
      .filter(
        (item) =>
          getId(item.productId) === id,
      )
      .reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0),
        0,
      );
  };

  // =========================================================
  // LOCAL EXCHANGE QUANTITY
  // =========================================================

  const getLocallySelectedExchangeQuantity = (
    productId,
  ) => {
    const id = getId(productId);

    return exchangeItems
      .filter(
        (item) =>
          getId(
            item.returnedProductId,
          ) === id,
      )
      .reduce(
        (total, item) =>
          total +
          Number(
            item.returnedQuantity || 0,
          ),
        0,
      );
  };

  // =========================================================
  // REMAINING FOR CURRENT SELECTION
  // =========================================================

  const getRemainingForSelection = (
    productId,
  ) => {
    const available =
      getAvailableReturnQuantity(
        productId,
      );

    const localReturn =
      getLocallySelectedReturnQuantity(
        productId,
      );

    const localExchange =
      getLocallySelectedExchangeQuantity(
        productId,
      );

    return Math.max(
      0,
      available -
        localReturn -
        localExchange,
    );
  };

  // =========================================================
  // SELECTION CHECKS
  // =========================================================

  const isSelectedForReturn = (
    productId,
  ) => {
    const id = getId(productId);

    return returnedItems.some(
      (item) =>
        getId(item.productId) === id,
    );
  };

  const isSelectedForExchange = (
    productId,
  ) => {
    const id = getId(productId);

    return exchangeItems.some(
      (item) =>
        getId(
          item.returnedProductId,
        ) === id,
    );
  };

  // =========================================================
  // ADD RETURN
  // =========================================================

  const addReturnItem = (
    productId,
    quantity = 1,
  ) => {
    const id = getId(productId);

    if (!id) return;

    if (isSelectedForExchange(id)) {
      setMessage(
        'This dress is already selected for exchange. Remove it from exchange first.',
      );
      setMessageType('error');
      return;
    }

    const remaining =
      getRemainingForSelection(id);

    if (remaining <= 0) {
      setMessage(
        'No remaining quantity is available for this return.',
      );
      setMessageType('error');
      return;
    }

    const requestedQuantity =
      Math.min(
        Math.max(
          1,
          Number(quantity || 1),
        ),
        remaining,
      );

    setReturnedItems(
      (previous) => {
        const existingIndex =
          previous.findIndex(
            (item) =>
              getId(item.productId) ===
              id,
          );

        if (existingIndex >= 0) {
          const updated = [
            ...previous,
          ];

          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: Math.min(
              remaining,
              Number(
                updated[existingIndex]
                  .quantity || 0,
              ) +
                requestedQuantity,
            ),
          };

          return updated;
        }

        return [
          ...previous,
          {
            productId: id,
            quantity:
              requestedQuantity,
          },
        ];
      },
    );

    setMessage('');
  };

  // =========================================================
  // REMOVE RETURN
  // =========================================================

  const removeReturnItem = (
    productId,
  ) => {
    const id = getId(productId);

    setReturnedItems(
      (previous) =>
        previous.filter(
          (item) =>
            getId(item.productId) !== id,
        ),
    );
  };

  // =========================================================
  // UPDATE RETURN QUANTITY
  // =========================================================

  const updateReturnQuantity = (
    productId,
    quantity,
  ) => {
    const id = getId(productId);

    const available =
      getAvailableReturnQuantity(id);

    const exchangeQty =
      getLocallySelectedExchangeQuantity(
        id,
      );

    const maxAllowed = Math.max(
      0,
      available - exchangeQty,
    );

    const nextQuantity = Math.min(
      maxAllowed,
      Math.max(
        0,
        Number(quantity || 0),
      ),
    );

    if (nextQuantity <= 0) {
      removeReturnItem(id);
      return;
    }

    setReturnedItems(
      (previous) =>
        previous.map((item) =>
          getId(item.productId) === id
            ? {
                ...item,
                quantity:
                  nextQuantity,
              }
            : item,
        ),
    );
  };

  // =========================================================
  // RESET REPLACEMENT ROWS
  // =========================================================

  const resetReplacementRows = () => {
    setReplacementRows([
      {
        id:
          Date.now() +
          Math.random(),
        productId: '',
        quantity: 1,
        search: '',
      },
    ]);
  };

  // =========================================================
  // SELECT ORIGINAL EXCHANGE PRODUCT
  // =========================================================

  const handleExchangeReturnProductChange = (
    event,
  ) => {
    const productId =
      event.target.value;

    setExchangeReturnProductId(
      productId,
    );

    if (!productId) {
      setExchangeReturnQuantity(1);
      resetReplacementRows();
      return;
    }

    const remaining =
      getRemainingForSelection(
        productId,
      );

    setExchangeReturnQuantity(
      remaining > 0 ? 1 : 0,
    );

    resetReplacementRows();

    setMessage('');
  };

  // =========================================================
  // ADD REPLACEMENT ROW
  // =========================================================

  const addReplacementRow = () => {
    setReplacementRows(
      (previous) => [
        ...previous,
        {
          id:
            Date.now() +
            Math.random(),
          productId: '',
          quantity: 1,
          search: '',
        },
      ],
    );
  };

  // =========================================================
  // REMOVE REPLACEMENT ROW
  // =========================================================

  const removeReplacementRow = (
    rowId,
  ) => {
    setReplacementRows(
      (previous) => {
        if (previous.length <= 1) {
          return [
            {
              id:
                Date.now() +
                Math.random(),
              productId: '',
              quantity: 1,
              search: '',
            },
          ];
        }

        return previous.filter(
          (row) =>
            row.id !== rowId,
        );
      },
    );
  };

  // =========================================================
  // UPDATE REPLACEMENT SEARCH
  // =========================================================

  const updateReplacementSearch = (
    rowId,
    value,
  ) => {
    setReplacementRows(
      (previous) =>
        previous.map((row) =>
          row.id === rowId
            ? {
                ...row,
                search: value,
                productId: '',
              }
            : row,
        ),
    );
  };

  // =========================================================
  // SELECT REPLACEMENT PRODUCT
  // =========================================================

  const selectReplacementProduct = (
    rowId,
    productId,
  ) => {
    const id = getId(productId);

    if (!id) return;

    if (
      exchangeReturnProductId &&
      id ===
        getId(
          exchangeReturnProductId,
        )
    ) {
      setMessage(
        'The replacement dress cannot be the same dress being returned.',
      );
      setMessageType('error');
      return;
    }

    setReplacementRows(
      (previous) =>
        previous.map((row) =>
          row.id === rowId
            ? {
                ...row,
                productId: id,
                search:
                  getProductName(id),
                quantity: Math.max(
                  1,
                  Math.min(
                    Number(
                      row.quantity || 1,
                    ),
                    getProductStock(id),
                  ),
                ),
              }
            : row,
        ),
    );

    setMessage('');
  };

  // =========================================================
  // UPDATE REPLACEMENT QUANTITY
  // =========================================================

  const updateReplacementQuantity = (
    rowId,
    quantity,
  ) => {
    setReplacementRows(
      (previous) =>
        previous.map((row) => {
          if (row.id !== rowId) {
            return row;
          }

          const productId =
            getId(row.productId);

          if (!productId) {
            return {
              ...row,
              quantity: Math.max(
                1,
                Number(
                  quantity || 1,
                ),
              ),
            };
          }

          const stock =
            getProductStock(
              productId,
            );

          return {
            ...row,
            quantity: Math.min(
              stock,
              Math.max(
                1,
                Number(
                  quantity || 1,
                ),
              ),
            ),
          };
        }),
    );
  };

  // =========================================================
  // REPLACEMENT STOCK USED
  // =========================================================

  const getReplacementStockAlreadyUsed = (
    productId,
    currentRowId = null,
  ) => {
    const id = getId(productId);

    return replacementRows
      .filter(
        (row) =>
          row.id !==
            currentRowId &&
          getId(row.productId) ===
            id,
      )
      .reduce(
        (total, row) =>
          total +
          Number(
            row.quantity || 0,
          ),
        0,
      );
  };

  // =========================================================
  // ADD EXCHANGE GROUP
  // =========================================================

  const addExchangeItem = () => {
    const returnedProductId =
      getId(
        exchangeReturnProductId,
      );

    if (!returnedProductId) {
      setMessage(
        'Please select the original dress to exchange.',
      );
      setMessageType('error');
      return;
    }

    if (
      isSelectedForReturn(
        returnedProductId,
      )
    ) {
      setMessage(
        'This dress is already selected for return. Remove it from returns first.',
      );
      setMessageType('error');
      return;
    }

    if (
      isSelectedForExchange(
        returnedProductId,
      )
    ) {
      setMessage(
        'This dress is already added to the exchange list.',
      );
      setMessageType('error');
      return;
    }

    const remaining =
      getRemainingForSelection(
        returnedProductId,
      );

    const returnedQuantity =
      Number(
        exchangeReturnQuantity || 0,
      );

    if (returnedQuantity <= 0) {
      setMessage(
        'Please enter a valid exchange quantity.',
      );
      setMessageType('error');
      return;
    }

    if (
      returnedQuantity >
      remaining
    ) {
      setMessage(
        `Only ${remaining} quantity is available for exchange.`,
      );
      setMessageType('error');
      return;
    }

    // -------------------------------------------------------
    // Validate replacement rows
    // -------------------------------------------------------

    const validReplacementRows =
      replacementRows.filter(
        (row) =>
          getId(row.productId),
      );

    if (
      validReplacementRows.length ===
      0
    ) {
      setMessage(
        'Please add at least one replacement dress.',
      );
      setMessageType('error');
      return;
    }

    // -------------------------------------------------------
    // Prevent duplicate replacement products
    // -------------------------------------------------------

    const replacementIds =
      validReplacementRows.map(
        (row) =>
          getId(row.productId),
      );

    const duplicateReplacementIds =
      replacementIds.filter(
        (id, index) =>
          replacementIds.indexOf(id) !==
          index,
      );

    if (
      duplicateReplacementIds.length >
      0
    ) {
      setMessage(
        'The same replacement dress cannot be added more than once. Increase its quantity instead.',
      );
      setMessageType('error');
      return;
    }

    // -------------------------------------------------------
    // Prevent returned dress being replacement
    // -------------------------------------------------------

    if (
      validReplacementRows.some(
        (row) =>
          getId(row.productId) ===
          returnedProductId,
      )
    ) {
      setMessage(
        'The returned dress cannot also be used as its replacement.',
      );
      setMessageType('error');
      return;
    }

    // -------------------------------------------------------
    // Validate replacement quantities
    // -------------------------------------------------------

    const replacementItems = [];

    for (const row of validReplacementRows) {
      const replacementProductId =
        getId(row.productId);

      const quantity = Number(
        row.quantity || 0,
      );

      if (quantity <= 0) {
        setMessage(
          'Replacement quantity must be at least 1.',
        );
        setMessageType('error');
        return;
      }

      const stock =
        getProductStock(
          replacementProductId,
        );

      const alreadyUsed =
        getReplacementStockAlreadyUsed(
          replacementProductId,
          row.id,
        );

      if (
        quantity + alreadyUsed >
        stock
      ) {
        setMessage(
          `${getProductName(
            replacementProductId,
          )} does not have enough stock.`,
        );
        setMessageType('error');
        return;
      }

      replacementItems.push({
        productId:
          replacementProductId,
        quantity,
      });
    }

    // -------------------------------------------------------
    // Add exchange group
    // -------------------------------------------------------

    setExchangeItems(
      (previous) => [
        ...previous,
        {
          returnedProductId,
          returnedQuantity,
          replacementItems,
        },
      ],
    );

    setExchangeReturnProductId('');
    setExchangeReturnQuantity(1);
    resetReplacementRows();

    setMessage('');
    setMessageType('');
  };

  // =========================================================
  // REMOVE EXCHANGE GROUP
  // =========================================================

  const removeExchangeItem = (
    returnedProductId,
  ) => {
    const id =
      getId(returnedProductId);

    setExchangeItems(
      (previous) =>
        previous.filter(
          (item) =>
            getId(
              item.returnedProductId,
            ) !== id,
        ),
    );
  };

  // =========================================================
  // UPDATE EXCHANGE RETURN QUANTITY
  // =========================================================

  const updateExchangeReturnQuantity = (
    returnedProductId,
    quantity,
  ) => {
    const id =
      getId(returnedProductId);

    const available =
      getAvailableReturnQuantity(
        id,
      );

    const returnQty =
      getLocallySelectedReturnQuantity(
        id,
      );

    const maxAllowed = Math.max(
      0,
      available - returnQty,
    );

    const nextQuantity = Math.min(
      maxAllowed,
      Math.max(
        0,
        Number(quantity || 0),
      ),
    );

    if (nextQuantity <= 0) {
      removeExchangeItem(id);
      return;
    }

    setExchangeItems(
      (previous) =>
        previous.map((item) =>
          getId(
            item.returnedProductId,
          ) === id
            ? {
                ...item,
                returnedQuantity:
                  nextQuantity,
              }
            : item,
        ),
    );
  };

  // =========================================================
  // REMOVE REPLACEMENT FROM EXCHANGE
  // =========================================================

  const removeReplacementFromExchange = (
    returnedProductId,
    replacementProductId,
  ) => {
    const returnedId =
      getId(returnedProductId);

    const replacementId =
      getId(replacementProductId);

    setExchangeItems(
      (previous) =>
        previous
          .map((exchange) => {
            if (
              getId(
                exchange.returnedProductId,
              ) !== returnedId
            ) {
              return exchange;
            }

            return {
              ...exchange,
              replacementItems:
                exchange.replacementItems.filter(
                  (replacement) =>
                    getId(
                      replacement.productId,
                    ) !== replacementId,
                ),
            };
          })
          .filter(
            (exchange) =>
              exchange.replacementItems
                .length > 0,
          ),
    );
  };

  // =========================================================
  // UPDATE EXCHANGE REPLACEMENT QUANTITY
  // =========================================================

  const updateExchangeReplacementQuantity = (
    returnedProductId,
    replacementProductId,
    quantity,
  ) => {
    const returnedId =
      getId(returnedProductId);

    const replacementId =
      getId(replacementProductId);

    const stock =
      getProductStock(
        replacementId,
      );

    const nextQuantity = Math.min(
      stock,
      Math.max(
        1,
        Number(quantity || 1),
      ),
    );

    setExchangeItems(
      (previous) =>
        previous.map((exchange) => {
          if (
            getId(
              exchange.returnedProductId,
            ) !== returnedId
          ) {
            return exchange;
          }

          return {
            ...exchange,
            replacementItems:
              exchange.replacementItems.map(
                (replacement) =>
                  getId(
                    replacement.productId,
                  ) === replacementId
                    ? {
                        ...replacement,
                        quantity:
                          nextQuantity,
                      }
                    : replacement,
              ),
          };
        }),
    );
  };

  // =========================================================
  // EXCHANGE AMOUNTS
  // =========================================================

  const getExchangeReturnedAmount = (
    exchange,
  ) => {
    const returnedPrice =
      getProductPrice(
        exchange.returnedProductId,
      );

    return (
      returnedPrice *
      Number(
        exchange.returnedQuantity ||
          0,
      )
    );
  };

  const getExchangeReplacementAmount = (
    exchange,
  ) => {
    if (
      !Array.isArray(
        exchange.replacementItems,
      )
    ) {
      return 0;
    }

    return exchange.replacementItems.reduce(
      (total, replacement) => {
        const price =
          getProductPrice(
            replacement.productId,
          );

        return (
          total +
          price *
            Number(
              replacement.quantity ||
                0,
            )
        );
      },
      0,
    );
  };

  // =========================================================
  // CURRENT TOTALS
  // =========================================================

  const returnAmount = useMemo(() => {
    return returnedItems.reduce(
      (total, item) => {
        return (
          total +
          getProductPrice(
            item.productId,
          ) *
            Number(
              item.quantity || 0,
            )
        );
      },
      0,
    );
  }, [
    returnedItems,
    products,
    sale,
  ]);

  const exchangeReturnedAmount =
    useMemo(() => {
      return exchangeItems.reduce(
        (total, exchange) =>
          total +
          getExchangeReturnedAmount(
            exchange,
          ),
        0,
      );
    }, [
      exchangeItems,
      products,
      sale,
    ]);

  const exchangeReplacementAmount =
    useMemo(() => {
      return exchangeItems.reduce(
        (total, exchange) =>
          total +
          getExchangeReplacementAmount(
            exchange,
          ),
        0,
      );
    }, [
      exchangeItems,
      products,
      sale,
    ]);

  const totalReturnedAmount =
    returnAmount +
    exchangeReturnedAmount;

  const totalReplacementAmount =
    exchangeReplacementAmount;

  const additionalPayment =
    Math.max(
      0,
      totalReplacementAmount -
        totalReturnedAmount,
    );

  const refundAmount = Math.max(
    0,
    totalReturnedAmount -
      totalReplacementAmount,
  );

  // =========================================================
  // EXTRACT TRANSACTION FROM RESPONSE
  // =========================================================

  const extractTransactionFromResponse = (
    data,
  ) => {
    if (!data) return null;

    // Most likely response shapes
    const candidates = [
      data?.transaction,
      data?.returnExchange,
      data?.data?.transaction,
      data?.data?.returnExchange,
      data?.data,
      data,
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;

      if (
        typeof candidate !==
        'object'
      ) {
        continue;
      }

      // A real transaction should have
      // documentNumber / originalInvoiceNumber
      if (
        candidate.documentNumber ||
        candidate.originalInvoiceNumber ||
        candidate.returnedItems ||
        candidate.exchangeItems
      ) {
        return candidate;
      }
    }

    return null;
  };

  // =========================================================
  // LOAD COMPLETED TRANSACTION IF POST RESPONSE
  // DOES NOT CONTAIN THE FULL DOCUMENT
  // =========================================================

  const resolveCompletedTransaction =
    async (
      responseData,
      normalizedInvoice,
    ) => {
      let transaction =
        extractTransactionFromResponse(
          responseData,
        );

      // If full transaction already exists
      if (
        transaction &&
        (
          transaction.returnedItems ||
          transaction.exchangeItems ||
          transaction.documentNumber
        )
      ) {
        return transaction;
      }

      // -------------------------------------------------------
      // Try ID returned by backend
      // -------------------------------------------------------

      const transactionId =
        getId(
          responseData?.transactionId ||
            responseData?.returnExchangeId ||
            responseData?.id ||
            responseData?._id ||
            responseData?.transaction?._id ||
            responseData?.returnExchange?._id ||
            responseData?.data?._id,
        );

      if (transactionId) {
        try {
          const detailResponse =
            await api.get(
              `/sales/return-exchanges/${transactionId}`,
            );

          const detailTransaction =
            extractTransactionFromResponse(
              detailResponse.data,
            );

          if (detailTransaction) {
            return detailTransaction;
          }
        } catch (detailError) {
          console.error(
            'COMPLETED TRANSACTION DETAIL LOAD ERROR:',
            detailError,
          );
        }
      }

      // -------------------------------------------------------
      // Final fallback: load all and find latest matching
      // transaction
      // -------------------------------------------------------

      try {
        const historyResponse =
          await api.get(
            '/sales/return-exchanges/all',
          );

        const allTransactions =
          Array.isArray(
            historyResponse.data,
          )
            ? historyResponse.data
            : historyResponse.data
                ?.transactions ||
              historyResponse.data
                ?.returnExchanges ||
              historyResponse.data
                ?.data ||
              [];

        const matching =
          allTransactions.filter(
            (item) => {
              const itemInvoice =
                normalizeInvoiceNumber(
                  item.originalInvoiceNumber ||
                    item.invoiceNumber ||
                    item.originalInvoice,
                );

              return (
                itemInvoice ===
                normalizedInvoice
              );
            },
          );

        if (matching.length > 0) {
          // If backend gave us document number,
          // prefer exact document match.
          const documentNumber =
            responseData?.documentNumber ||
            responseData?.transaction
              ?.documentNumber ||
            responseData?.returnExchange
              ?.documentNumber ||
            responseData?.data
              ?.documentNumber;

          if (documentNumber) {
            const exact =
              matching.find(
                (item) =>
                  item.documentNumber ===
                  documentNumber,
              );

            if (exact) {
              return exact;
            }
          }

          // Otherwise latest created transaction
          const sorted = [
            ...matching,
          ].sort((a, b) => {
            const dateA = new Date(
              a.createdAt ||
                a.transactionDate ||
                0,
            ).getTime();

            const dateB = new Date(
              b.createdAt ||
                b.transactionDate ||
                0,
            ).getTime();

            return dateB - dateA;
          });

          return sorted[0];
        }
      } catch (historyError) {
        console.error(
          'COMPLETED TRANSACTION HISTORY FALLBACK ERROR:',
          historyError,
        );
      }

      return transaction;
    };

  // =========================================================
  // SUBMIT RETURN / EXCHANGE
  // =========================================================

  const submitReturnExchange =
    async () => {
      if (!sale) {
        setMessage(
          'Please search an invoice first.',
        );
        setMessageType('error');
        return;
      }

      if (
        returnedItems.length === 0 &&
        exchangeItems.length === 0
      ) {
        setMessage(
          'Please add at least one return or exchange.',
        );
        setMessageType('error');
        return;
      }

      // -------------------------------------------------------
      // Final validation
      // -------------------------------------------------------

      for (const item of returnedItems) {
        const available =
          getAvailableReturnQuantity(
            item.productId,
          );

        if (
          Number(
            item.quantity || 0,
          ) > available
        ) {
          setMessage(
            `${getProductName(
              item.productId,
            )}: only ${available} quantity is available for return.`,
          );
          setMessageType('error');
          return;
        }
      }

      for (const exchange of exchangeItems) {
        const available =
          getAvailableReturnQuantity(
            exchange.returnedProductId,
          );

        if (
          Number(
            exchange.returnedQuantity ||
              0,
          ) > available
        ) {
          setMessage(
            `${getProductName(
              exchange.returnedProductId,
            )}: only ${available} quantity is available for exchange.`,
          );
          setMessageType('error');
          return;
        }

        if (
          !Array.isArray(
            exchange.replacementItems,
          ) ||
          exchange.replacementItems
            .length === 0
        ) {
          setMessage(
            'Every exchange must have at least one replacement dress.',
          );
          setMessageType('error');
          return;
        }
      }

      // -------------------------------------------------------
      // Payload
      // -------------------------------------------------------

      const normalizedInvoice =
        normalizeInvoiceNumber(
          invoiceNumber ||
            sale.invoiceNumber,
        );

      const payload = {
        originalInvoiceNumber:
          normalizedInvoice,

        returnedItems:
          returnedItems.map(
            (item) => ({
              productId: getId(
                item.productId,
              ),
              quantity: Number(
                item.quantity,
              ),
            }),
          ),

        exchangeItems:
          exchangeItems.map(
            (exchange) => ({
              returnedProductId:
                getId(
                  exchange.returnedProductId,
                ),

              returnedQuantity:
                Number(
                  exchange.returnedQuantity,
                ),

              replacementItems:
                exchange.replacementItems.map(
                  (replacement) => ({
                    productId: getId(
                      replacement.productId,
                    ),
                    quantity: Number(
                      replacement.quantity,
                    ),
                  }),
                ),
            }),
          ),

        paymentMethod,
        note: note.trim(),
      };

      console.log(
        'RETURN/EXCHANGE REQUEST:',
        payload,
      );

      setLoading(true);
      setMessage('');
      setMessageType('');

      try {
        const response =
          await api.post(
            '/sales/return-exchange',
            payload,
          );

        console.log(
          'RETURN/EXCHANGE RESPONSE:',
          response.data,
        );

        // -----------------------------------------------------
        // Resolve completed transaction
        // -----------------------------------------------------

        const transaction =
          await resolveCompletedTransaction(
            response.data,
            normalizedInvoice,
          );

        if (!transaction) {
          throw new Error(
            'Return / exchange was processed, but the completed receipt data could not be loaded.',
          );
        }

        console.log(
          'FINAL RECEIPT TRANSACTION:',
          transaction,
        );

        // -----------------------------------------------------
        // IMPORTANT:
        // Save receipt state BEFORE clearing sale
        // -----------------------------------------------------

        setCompletedOriginalSale(
          sale,
        );

        setCompletedTransaction(
          transaction,
        );

        // -----------------------------------------------------
        // Refresh products
        // -----------------------------------------------------

        await loadProducts();

        // -----------------------------------------------------
        // Refresh history
        // -----------------------------------------------------

        await loadReturnExchangeHistory(
          normalizedInvoice,
        );

        // -----------------------------------------------------
        // Clear active form
        // -----------------------------------------------------

        setReturnedItems([]);
        setExchangeItems([]);
        setExchangeReturnProductId(
          '',
        );
        setExchangeReturnQuantity(1);

        resetReplacementRows();

        setNote('');

        // Do NOT clear completed receipt state
        setSale(null);
        setInvoiceNumber('');

        setMessage(
          'Return / exchange completed successfully.',
        );
        setMessageType('success');
      } catch (error) {
        console.error(
          'RETURN/EXCHANGE ERROR:',
          error,
        );

        console.error(
          'BACKEND RESPONSE:',
          error?.response?.data,
        );

        setMessage(
          error?.response?.data
            ?.message ||
            error?.message ||
            'Unable to process return / exchange.',
        );

        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };

  // =========================================================
  // START NEW TRANSACTION
  // =========================================================

  const startNewTransaction = () => {
    setInvoiceNumber('');
    setSale(null);

    setCompletedOriginalSale(
      null,
    );

    setCompletedTransaction(
      null,
    );

    setReturnExchangeHistory([]);

    setReturnedItems([]);
    setExchangeItems([]);

    setExchangeReturnProductId(
      '',
    );

    setExchangeReturnQuantity(1);

    resetReplacementRows();

    setPaymentMethod('cash');
    setNote('');

    setMessage('');
    setMessageType('');
  };

  // =========================================================
  // SALE ITEMS
  // =========================================================

  const saleItems = useMemo(() => {
    if (!sale?.items) return [];

    return Array.isArray(sale.items)
      ? sale.items
      : [];
  }, [sale]);

  // =========================================================
  // EXCHANGEABLE ITEMS
  // =========================================================

  const exchangeableItems =
    useMemo(() => {
      return saleItems.filter(
        (item) => {
          const productId =
            getId(
              item.productId ||
                item.product ||
                item._id,
            );

          return (
            productId &&
            getRemainingForSelection(
              productId,
            ) > 0 &&
            !isSelectedForReturn(
              productId,
            ) &&
            !isSelectedForExchange(
              productId,
            )
          );
        },
      );
    }, [
      saleItems,
      returnExchangeHistory,
      returnedItems,
      exchangeItems,
    ]);

  // =========================================================
  // REPLACEMENT SEARCH
  // =========================================================

  const getReplacementSearchResults = (
    search,
  ) => {
    const term = String(
      search || '',
    )
      .trim()
      .toLowerCase();

    if (!term) return [];

    return products
      .filter((product) => {
        const name = String(
          product.dressName || '',
        ).toLowerCase();

        const category = String(
          product.category || '',
        ).toLowerCase();

        const brand = String(
          product.brand || '',
        ).toLowerCase();

        const size = String(
          product.size || '',
        ).toLowerCase();

        const color = String(
          product.color || '',
        ).toLowerCase();

        return (
          name.includes(term) ||
          category.includes(term) ||
          brand.includes(term) ||
          size.includes(term) ||
          color.includes(term)
        );
      })
      .filter(
        (product) =>
          Number(
            product.stockQuantity || 0,
          ) > 0,
      )
      .slice(0, 8);
  };

  // =========================================================
  // RECEIPT HELPERS
  // =========================================================

  const formatMoney = (value) => {
    return Number(
      value || 0,
    ).toLocaleString(
      'en-PK',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      },
    );
  };

  const formatDate = (value) => {
    if (!value) return '';

    try {
      return new Date(
        value,
      ).toLocaleString(
        'en-PK',
        {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      );
    } catch {
      return '';
    }
  };

  const getTransactionTypeLabel =
    () => {
      if (!completedTransaction) {
        return 'RETURN / EXCHANGE';
      }

      const type =
        completedTransaction.type ||
        '';

      if (type === 'return') {
        return 'RETURN RECEIPT';
      }

      if (type === 'exchange') {
        return 'EXCHANGE RECEIPT';
      }

      return 'RETURN / EXCHANGE';
    };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="return-exchange-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="page-header">
        <div>
          <h1>Return / Exchange</h1>

          <p>
            Search an invoice and process customer
            returns or exchanges.
          </p>
        </div>
      </div>

      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {message && (
        <div
          className={`message ${
            messageType === 'error'
              ? 'error'
              : 'success'
          }`}
        >
          {message}
        </div>
      )}

      {/* =====================================================
          COMPLETED RECEIPT
      ===================================================== */}

      {completedTransaction ? (
        <div className="return-receipt-section">
          <div className="receipt-page">
            <div className="receipt">

              {/* =========================
                  HEADER — SAME AS NORMAL RECEIPT
              ========================= */}

              <div className="receipt-header">

                <h1 className="receipt-shop-name">
                  <span className="receipt-glam">GLAM</span>
                  <span className="receipt-by">BY</span>
                  <span className="receipt-hh">HH</span>
                </h1>

                <p className="receipt-subtitle">
                  Boutique Fashion
                </p>

                <p className="receipt-address">
                  SHOP NO # 16 CANTT SADDAR HYDERABAD
                </p>

                <p className="receipt-whatsapp">
                  <img
                    src="/Digital_Glyph_Black_RGB_2026.svg"
                    alt="WhatsApp"
                    className="whatsapp-icon"
                  />
                  <span>0315-3039460</span>
                </p>

              <div className="receipt-divider"></div>

                <h2>{getTransactionTypeLabel()}</h2>

              </div>

              {/* =========================
                  TRANSACTION INFORMATION
              ========================= */}

              <div className="receipt-info">

                <div className="receipt-info-row">
                  <span>Document No</span>
                  <strong>
                    {completedTransaction.documentNumber || '-'}
                  </strong>
                </div>

                <div className="receipt-info-row">
                  <span>Invoice No</span>
                  <strong>
                    {completedTransaction.originalInvoiceNumber ||
                      completedOriginalSale?.invoiceNumber ||
                      '-'}
                  </strong>
                </div>

                <div className="receipt-info-row">
                  <span>Date</span>
                  <strong>
                    {formatDate(
                      completedTransaction.createdAt ||
                        completedTransaction.transactionDate,
                    )}
                  </strong>
                </div>

                <div className="receipt-info-row">
                  <span>Payment</span>
                  <strong>
                    {String(
                      completedTransaction.paymentMethod || 'cash',
                    ).toUpperCase()}
                  </strong>
                </div>

              </div>
                      <div className="receipt-divider"></div>



              {/* =========================
                  RETURNED ITEMS
              ========================= */}

              {Array.isArray(completedTransaction.returnedItems) &&
                completedTransaction.returnedItems.length > 0 && (
                  <>
                    <div className="receipt-product-wrapper">
                      <div className="receipt-item">
                        <div className="receipt-item-left">
                          <strong className="receipt-product-name">
                            RETURNED ITEMS
                          </strong>
                        </div>
                      </div>
                    </div>

                    {completedTransaction.returnedItems.map(
                      (item, index) => {
                        const price = Number(item.price || 0);
                        const quantity = Number(item.quantity || 0);
                        const subtotal =
                          Number(item.subtotal) || price * quantity;

                        return (
                          <div
                            className="receipt-product-wrapper"
                            key={`return-${index}`}
                          >
                            <div className="receipt-item">
                              <div className="receipt-item-left">
                                <strong className="receipt-product-name">
                                  {item.dressName || 'Dress'}
                                </strong>
                                <span>Qty: {quantity}</span>
                                <span>Price: Rs. {formatMoney(price)}</span>
                              </div>

                              <div className="receipt-item-right">
                                <strong className="receipt-sale-price-label">
                                  RETURN
                                </strong>
                                <span className="receipt-sale-price">
                                  Rs. {formatMoney(price)}
                                </span>
                                <strong>
                                  - Rs. {formatMoney(subtotal)}
                                </strong>
                              </div>
                            </div>

                            {index <
                              completedTransaction.returnedItems.length - 1 && (
                              <div className="receipt-product-divider"></div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </>
                )}

              {/* =========================
                  EXCHANGE ITEMS
              ========================= */}

              {Array.isArray(completedTransaction.exchangeItems) &&
                completedTransaction.exchangeItems.length > 0 && (
                  <>
                    <div className="receipt-divider"></div>

                    <div className="receipt-product-wrapper">
                      <div className="receipt-item">
                        <div className="receipt-item-left">
                          <strong className="receipt-product-name">
                            EXCHANGE ITEMS
                          </strong>
                        </div>
                      </div>
                    </div>

                    {completedTransaction.exchangeItems.map(
                      (exchange, index) => {
                        const returnedPrice = Number(
                          exchange.returnedPrice || 0,
                        );
                        const returnedQuantity = Number(
                          exchange.returnedQuantity || 0,
                        );
                        const returnedSubtotal =
                          returnedPrice * returnedQuantity;

                        let replacementItems = Array.isArray(
                          exchange.replacementItems,
                        )
                          ? exchange.replacementItems
                          : [];

                        if (
                          replacementItems.length === 0 &&
                          exchange.replacementProduct
                        ) {
                          replacementItems = [
                            {
                              product: exchange.replacementProduct,
                              productId: exchange.replacementProduct,
                              dressName: exchange.replacementDressName,
                              quantity: exchange.replacementQuantity,
                              price: exchange.replacementPrice,
                            },
                          ];
                        }

                        return (
                          <div
                            className="receipt-product-wrapper"
                            key={`exchange-${index}`}
                          >
                            <div className="receipt-item">
                              <div className="receipt-item-left">
                                <strong className="receipt-product-name">
                                  RETURNED: {exchange.returnedDressName || 'Dress'}
                                </strong>
                                <span>Qty: {returnedQuantity}</span>
                                <span>
                                  Price: Rs. {formatMoney(returnedPrice)}
                                </span>
                              </div>

                              <div className="receipt-item-right">
                                <strong className="receipt-sale-price-label">
                                  RETURN
                                </strong>
                                <span className="receipt-sale-price">
                                  Rs. {formatMoney(returnedPrice)}
                                </span>
                                <strong>
                                  - Rs. {formatMoney(returnedSubtotal)}
                                </strong>
                              </div>
                            </div>

                            <div className="receipt-product-divider"></div>

                            {replacementItems.map(
                              (replacement, replacementIndex) => {
                                const replacementId =
                                  replacement.productId ||
                                  replacement.product;
                                const price =
                                  Number(replacement.price) ||
                                  getProductPrice(replacementId);
                                const quantity = Number(
                                  replacement.quantity || 0,
                                );
                                const subtotal = price * quantity;

                                return (
                                  <div
                                    className="receipt-item"
                                    key={`replacement-${index}-${replacementIndex}`}
                                    style={{ marginBottom: '8px' }}
                                  >
                                    <div className="receipt-item-left">
                                      <strong className="receipt-product-name">
                                        REPLACEMENT:{' '}
                                        {replacement.dressName ||
                                          getProductName(replacementId) ||
                                          'Dress'}
                                      </strong>
                                      <span>Qty: {quantity}</span>
                                      <span>
                                        Price: Rs. {formatMoney(price)}
                                      </span>
                                    </div>

                                    <div className="receipt-item-right">
                                      <strong className="receipt-sale-price-label">
                                        REPLACEMENT
                                      </strong>
                                      <span className="receipt-sale-price">
                                        Rs. {formatMoney(price)}
                                      </span>
                                      <strong>
                                        + Rs. {formatMoney(subtotal)}
                                      </strong>
                                    </div>
                                  </div>
                                );
                              },
                            )}

                            {index <
                              completedTransaction.exchangeItems.length - 1 && (
                              <div className="receipt-product-divider"></div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </>
                )}

              <div className="receipt-divider"></div>

              {/* =========================
                  TOTALS — SAME RECEIPT STYLE
              ========================= */}

              <div className="receipt-total-row">
                <span>RETURNED</span>
                <strong>
                  Rs. {formatMoney(
                    completedTransaction.returnAmount || 0,
                  )}
                </strong>
              </div>

              <div className="receipt-total-row">
                <span>REPLACEMENT</span>
                <strong>
                  Rs. {formatMoney(
                    completedTransaction.exchangeAmount || 0,
                  )}
                </strong>
              </div>

              {Number(completedTransaction.additionalPayment || 0) > 0 && (
                <div className="receipt-total-row">
                  <span>ADDITIONAL PAYMENT</span>
                  <strong>
                    Rs. {formatMoney(
                      completedTransaction.additionalPayment,
                    )}
                  </strong>
                </div>
              )}

              {Number(completedTransaction.refundAmount || 0) > 0 && (
                <div className="receipt-total-row">
                  <span>REFUND</span>
                  <strong>
                    Rs. {formatMoney(
                      completedTransaction.refundAmount,
                    )}
                  </strong>
                </div>
              )}

              <div className="receipt-divider"></div>

              {/* =========================
                  FOOTER — SAME AS NORMAL RECEIPT
              ========================= */}

              <div className="receipt-footer">
                <p className="receipt-thank-you">
                  Thank you for shopping with us!
                </p>

                <p className="receipt-follow">
                  Follow us on social media
                </p>

                <p className="receipt-social">
                  Instagram: glam_by_hh
                </p>

                <p className="receipt-social">
                  TikTok: glam_by_hh
                </p>

                <p className="receipt-social">
                  Facebook: Glam By HH
                </p>

                <p className="receipt-developed">
                  Developed by Taha Siddique
                </p>
              </div>

              <button
                className="print-receipt-button"
                onClick={() => window.print()}
              >
                Print Receipt
              </button>

            </div>
          </div>

          <div
            className="receipt-actions"
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '16px',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary new-return-button no-print"
              onClick={startNewTransaction}
            >
              New Return / Exchange
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ===================================================
              INVOICE SEARCH
          =================================================== */}

          <div className="card invoice-search-card" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <div className="card-header">
              <div>
                <h2>
                  Find Original Invoice
                </h2>

                <p>
                  Enter the customer's original
                  invoice number.
                </p>
              </div>
            </div>

            <div className="invoice-search-form">
              <input
                type="text"
                value={invoiceNumber}
                onChange={(event) =>
                  setInvoiceNumber(
                    event.target.value.toUpperCase(),
                  )
                }
                onKeyDown={
                  handleInvoiceKeyDown
                }
                placeholder="e.g. 11 or INV-00011"
              />

              <button
                type="button"
                className="btn btn-primary"
                onClick={searchInvoice}
                disabled={searching}
              >
                {searching
                  ? 'Searching...'
                  : 'Search Invoice'}
              </button>
            </div>

            <div className="invoice-search-hint">
              You can enter <strong>11</strong>,
              <strong> INV11</strong>, or{' '}
              <strong>INV-00011</strong>.
            </div>
          </div>

          {/* ===================================================
              ORIGINAL SALE
          =================================================== */}

          {sale && (
            <>
              {/* INVOICE SUMMARY */}

              <div className="card" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <div className="card-header">
                  <div>
                    <h2>
                      Original Invoice:{' '}
                      {sale.invoiceNumber ||
                        invoiceNumber}
                    </h2>

                    <p>
                      All original items remain visible.
                      Previously processed quantities are
                      shown below.
                    </p>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Dress</th>
                        <th>Size</th>
                        <th>Color</th>
                        <th>Sold Qty</th>
                        <th>Processed</th>
                        <th>Remaining</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {saleItems.map(
                        (
                          item,
                          index,
                        ) => {
                          const productId =
                            getId(
                              item.productId ||
                                item.product ||
                                item._id,
                            );

                          const sold =
                            getSoldQuantity(
                              productId,
                            );

                          const processed =
                            getProcessedQuantity(
                              productId,
                            );

                          const remaining =
                            Math.max(
                              0,
                              sold -
                                processed,
                            );

                          const status =
                            getItemStatus(
                              productId,
                            );

                          const localReturn =
                            getLocallySelectedReturnQuantity(
                              productId,
                            );

                          const localExchange =
                            getLocallySelectedExchangeQuantity(
                              productId,
                            );

                          const selected =
                            localReturn >
                              0 ||
                            localExchange >
                              0;

                          return (
                            <tr
                              key={
                                productId ||
                                index
                              }
                            >
                              <td>
                                <strong>
                                  {item.dressName ||
                                    item.productName ||
                                    item.name ||
                                    'Dress'}
                                </strong>
                              </td>

                              <td>
                                {item.size ||
                                  '-'}
                              </td>

                              <td>
                                {item.color ||
                                  '-'}
                              </td>

                              <td>
                                {sold}
                              </td>

                              <td>
                                {processed}
                              </td>

                              <td>
                                <strong>
                                  {
                                    remaining
                                  }
                                </strong>
                              </td>

                              <td>
                                Rs.{' '}
                                {formatMoney(
                                  getReceiptPrice(
                                    item,
                                  ),
                                )}
                              </td>

                              <td>
                                {status ===
                                  'fully-processed' && (
                                  <span className="status-badge status-danger">
                                    Already Fully
                                    Returned /
                                    Exchanged
                                  </span>
                                )}

                                {status ===
                                  'partially-processed' && (
                                  <span className="status-badge status-warning">
                                    Partially
                                    Processed
                                  </span>
                                )}

                                {status ===
                                  'available' && (
                                  <span className="status-badge status-success">
                                    Available
                                  </span>
                                )}

                                {selected && (
                                  <div
                                    style={{
                                      marginTop:
                                        '4px',
                                    }}
                                  >
                                    <span className="status-badge">
                                      Selected
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td>
                                {remaining <=
                                0 ? (
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    disabled
                                  >
                                    Fully
                                    Processed
                                  </button>
                                ) : isSelectedForReturn(
                                    productId,
                                  ) ? (
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() =>
                                      removeReturnItem(
                                        productId,
                                      )
                                    }
                                  >
                                    Remove Return
                                  </button>
                                ) : isSelectedForExchange(
                                    productId,
                                  ) ? (
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() =>
                                      removeExchangeItem(
                                        productId,
                                      )
                                    }
                                  >
                                    Remove Exchange
                                  </button>
                                ) : (
                                  <div
                                    className="action-buttons"
                                    style={{
                                      display:
                                        'flex',
                                      gap:
                                        '6px',
                                      flexWrap:
                                        'wrap',
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      onClick={() =>
                                        addReturnItem(
                                          productId,
                                          1,
                                        )
                                      }
                                    >
                                      Return
                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      onClick={() => {
                                        setExchangeReturnProductId(
                                          productId,
                                        );

                                        setExchangeReturnQuantity(
                                          1,
                                        );

                                        resetReplacementRows();

                                        document
                                          .getElementById(
                                            'exchange-builder',
                                          )
                                          ?.scrollIntoView(
                                            {
                                              behavior:
                                                'smooth',
                                              block:
                                                'center',
                                            },
                                          );
                                      }}
                                    >
                                      Exchange
                                    </button>
                                  </div>
                                )}

                                {(
                                  localReturn >
                                    0 ||
                                  localExchange >
                                    0
                                ) && (
                                  <div
                                    style={{
                                      marginTop:
                                        '8px',
                                    }}
                                  >
                                    <span>
                                      Selected Qty:{' '}
                                      {localReturn +
                                        localExchange}
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* =================================================
                  RETURN SECTION
              ================================================= */}

              <div className="card">
                <div className="card-header">
                  <div>
                    <h2>
                      Return Items
                    </h2>

                    <p>
                      Select dresses the customer is
                      returning without exchange.
                    </p>
                  </div>
                </div>

                {returnedItems.length ===
                0 ? (
                  <div className="empty-state">
                    No return items selected.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Dress</th>
                          <th>
                            Available
                          </th>
                          <th>
                            Return Qty
                          </th>
                          <th>Price</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {returnedItems.map(
                          (item) => {
                            const productId =
                              getId(
                                item.productId,
                              );

                            const price =
                              getProductPrice(
                                productId,
                              );

                            const remaining =
                              getRemainingForSelection(
                                productId,
                              ) +
                              Number(
                                item.quantity ||
                                  0,
                              );

                            return (
                              <tr
                                key={
                                  productId
                                }
                              >
                                <td>
                                  <strong>
                                    {getProductName(
                                      productId,
                                    )}
                                  </strong>
                                </td>

                                <td>
                                  {
                                    remaining
                                  }
                                </td>

                                <td>
                                  <input
                                    type="number"
                                    min="1"
                                    max={
                                      remaining
                                    }
                                    value={
                                      item.quantity
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      updateReturnQuantity(
                                        productId,
                                        event
                                          .target
                                          .value,
                                      )
                                    }
                                    style={{
                                      width:
                                        '90px',
                                    }}
                                  />
                                </td>

                                <td>
                                  Rs.{' '}
                                  {formatMoney(
                                    price,
                                  )}
                                </td>

                                <td>
                                  Rs.{' '}
                                  {formatMoney(
                                    price *
                                      Number(
                                        item.quantity ||
                                          0,
                                      ),
                                  )}
                                </td>

                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() =>
                                      removeReturnItem(
                                        productId,
                                      )
                                    }
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="section-total">
                  <strong>
                    Return Amount
                  </strong>

                  <strong>
                    Rs.{' '}
                    {formatMoney(
                      returnAmount,
                    )}
                  </strong>
                </div>
              </div>

              {/* =================================================
                  EXCHANGE BUILDER
              ================================================= */}

              <div
                className="card"
                id="exchange-builder"
              >
                <div className="card-header">
                  <div>
                    <h2>
                      Build Exchange
                    </h2>

                    <p>
                      One returned dress can be exchanged
                      for multiple replacement dresses.
                    </p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Returned Dress
                    </label>

                    <select
                      value={
                        exchangeReturnProductId
                      }
                      onChange={
                        handleExchangeReturnProductChange
                      }
                    >
                      <option value="">
                        Select original dress
                      </option>

                      {exchangeableItems.map(
                        (
                          item,
                          index,
                        ) => {
                          const productId =
                            getId(
                              item.productId ||
                                item.product ||
                                item._id,
                            );

                          const remaining =
                            getRemainingForSelection(
                              productId,
                            );

                          return (
                            <option
                              key={
                                productId ||
                                index
                              }
                              value={
                                productId
                              }
                            >
                              {item.dressName ||
                                item.productName ||
                                item.name ||
                                'Dress'}{' '}
                              — Remaining:{' '}
                              {
                                remaining
                              }
                            </option>
                          );
                        },
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Return Qty
                    </label>

                    <input
                      type="number"
                      min="1"
                      max={
                        exchangeReturnProductId
                          ? getRemainingForSelection(
                              exchangeReturnProductId,
                            )
                          : 1
                      }
                      value={
                        exchangeReturnQuantity
                      }
                      disabled={
                        !exchangeReturnProductId
                      }
                      onChange={(event) =>
                        setExchangeReturnQuantity(
                          Number(
                            event.target.value,
                          ),
                        )
                      }
                    />
                  </div>
                </div>

                {exchangeReturnProductId && (
                  <div className="replacement-section">
                    <div className="section-subheading">
                      <h3>
                        Replacement Dresses
                      </h3>

                      <p>
                        Add one or more replacement
                        dresses.
                      </p>
                    </div>

                    {replacementRows.map(
                      (
                        row,
                        index,
                      ) => {
                        const results =
                          getReplacementSearchResults(
                            row.search,
                          );

                        const selectedProduct =
                          row.productId
                            ? findProduct(
                                row.productId,
                              )
                            : null;

                        const usedByOtherRows =
                          row.productId
                            ? getReplacementStockAlreadyUsed(
                                row.productId,
                                row.id,
                              )
                            : 0;

                        const availableStock =
                          row.productId
                            ? Math.max(
                                0,
                                getProductStock(
                                  row.productId,
                                ) -
                                  usedByOtherRows,
                              )
                            : 0;

                        return (
                          <div
                            className="replacement-row"
                            key={
                              row.id
                            }
                          >
                            <div className="form-grid">
                              <div className="form-group">
                                <label>
                                  Replacement Dress{' '}
                                  {index +
                                    1}
                                </label>

                                <input
                                  type="text"
                                  value={
                                    row.search
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateReplacementSearch(
                                      row.id,
                                      event
                                        .target
                                        .value,
                                    )
                                  }
                                  placeholder="Search dress name, brand, category..."
                                />

                                {row.search &&
                                  !row.productId &&
                                  results.length >
                                    0 && (
                                    <div className="search-results">
                                      {results.map(
                                        (
                                          product,
                                        ) => {
                                          const productId =
                                            getId(
                                              product._id,
                                            );

                                          const isSameAsReturned =
                                            productId ===
                                            getId(
                                              exchangeReturnProductId,
                                            );

                                          const alreadySelectedInAnotherRow =
                                            replacementRows.some(
                                              (
                                                otherRow,
                                              ) =>
                                                otherRow.id !==
                                                  row.id &&
                                                getId(
                                                  otherRow.productId,
                                                ) ===
                                                  productId,
                                            );

                                          return (
                                            <button
                                              type="button"
                                              key={
                                                productId
                                              }
                                              className="search-result-item"
                                              disabled={
                                                isSameAsReturned ||
                                                alreadySelectedInAnotherRow
                                              }
                                              onClick={() =>
                                                selectReplacementProduct(
                                                  row.id,
                                                  productId,
                                                )
                                              }
                                            >
                                              <strong>
                                                {
                                                  product.dressName
                                                }
                                              </strong>

                                              <span>
                                                {' '}
                                                — Rs.{' '}
                                                {formatMoney(
                                                  getSalePrice(
                                                    product,
                                                  ),
                                                )}{' '}
                                                — Stock:{' '}
                                                {
                                                  product.stockQuantity
                                                }
                                              </span>
                                            </button>
                                          );
                                        },
                                      )}
                                    </div>
                                  )}
                              </div>

                              <div className="form-group">
                                <label>
                                  Quantity
                                  {row.productId &&
                                    ` (Stock: ${availableStock})`}
                                </label>

                                <input
                                  type="number"
                                  min="1"
                                  max={
                                    row.productId
                                      ? availableStock
                                      : 1
                                  }
                                  value={
                                    row.quantity
                                  }
                                  disabled={
                                    !row.productId
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateReplacementQuantity(
                                      row.id,
                                      event
                                        .target
                                        .value,
                                    )
                                  }
                                />
                              </div>

                              <div className="form-group replacement-remove-button">
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  onClick={() =>
                                    removeReplacementRow(
                                      row.id,
                                    )
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {selectedProduct && (
                              <div className="selected-product-info">
                                <strong>
                                  {
                                    selectedProduct.dressName
                                  }
                                </strong>

                                <span>
                                  {' '}
                                  — Rs.{' '}
                                  {formatMoney(
                                    getSalePrice(
                                      selectedProduct,
                                    ),
                                  )}{' '}
                                  ×{' '}
                                  {
                                    row.quantity
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}

                    <div className="action-buttons replacement-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={
                          addReplacementRow
                        }
                      >
                        + Add Replacement Dress
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={
                          addExchangeItem
                        }
                      >
                        Add Exchange
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* =================================================
                  SELECTED EXCHANGES
              ================================================= */}

              {exchangeItems.length >
                0 && (
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h2>
                        Selected Exchanges
                      </h2>

                      <p>
                        Each returned dress can contain
                        multiple replacement dresses.
                      </p>
                    </div>
                  </div>

                  {exchangeItems.map(
                    (
                      exchange,
                      index,
                    ) => {
                      const returnedPrice =
                        getProductPrice(
                          exchange.returnedProductId,
                        );

                      const returnedTotal =
                        returnedPrice *
                        Number(
                          exchange.returnedQuantity ||
                            0,
                        );

                      const replacementTotal =
                        getExchangeReplacementAmount(
                          exchange,
                        );

                      const difference =
                        replacementTotal -
                        returnedTotal;

                      return (
                        <div
                          className="exchange-card"
                          key={`${getId(
                            exchange.returnedProductId,
                          )}-${index}`}
                        >
                          <div className="exchange-card-header">
                            <div>
                              <strong>
                                Returned:{' '}
                                {getProductName(
                                  exchange.returnedProductId,
                                )}
                              </strong>

                              <div>
                                Quantity:{' '}
                                {
                                  exchange.returnedQuantity
                                }
                              </div>
                            </div>

                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() =>
                                removeExchangeItem(
                                  exchange.returnedProductId,
                                )
                              }
                            >
                              Remove Exchange
                            </button>
                          </div>

                          <div className="table-responsive exchange-replacement-table">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>
                                    Replacement
                                  </th>
                                  <th>
                                    Qty
                                  </th>
                                  <th>
                                    Price
                                  </th>
                                  <th>
                                    Total
                                  </th>
                                  <th>
                                    Action
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {exchange.replacementItems.map(
                                  (
                                    replacement,
                                    replacementIndex,
                                  ) => {
                                    const replacementId =
                                      getId(
                                        replacement.productId,
                                      );

                                    const price =
                                      getProductPrice(
                                        replacementId,
                                      );

                                    const total =
                                      price *
                                      Number(
                                        replacement.quantity ||
                                          0,
                                      );

                                    return (
                                      <tr
                                        key={`${replacementId}-${replacementIndex}`}
                                      >
                                        <td>
                                          <strong>
                                            {getProductName(
                                              replacementId,
                                            )}
                                          </strong>
                                        </td>

                                        <td>
                                          <input
                                            type="number"
                                            min="1"
                                            max={getProductStock(
                                              replacementId,
                                            )}
                                            value={
                                              replacement.quantity
                                            }
                                            onChange={(
                                              event,
                                            ) =>
                                              updateExchangeReplacementQuantity(
                                                exchange.returnedProductId,
                                                replacementId,
                                                event
                                                  .target
                                                  .value,
                                              )
                                            }
                                            style={{
                                              width:
                                                '80px',
                                            }}
                                          />
                                        </td>

                                        <td>
                                          Rs.{' '}
                                          {formatMoney(
                                            price,
                                          )}
                                        </td>

                                        <td>
                                          Rs.{' '}
                                          {formatMoney(
                                            total,
                                          )}
                                        </td>

                                        <td>
                                          <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() =>
                                              removeReplacementFromExchange(
                                                exchange.returnedProductId,
                                                replacementId,
                                              )
                                            }
                                          >
                                            Remove
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  },
                                )}
                              </tbody>
                            </table>
                          </div>

                          <div className="exchange-summary">
                            <div>
                              <span>
                                Returned Value
                              </span>

                              <strong>
                                Rs.{' '}
                                {formatMoney(
                                  returnedTotal,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Replacement Value
                              </span>

                              <strong>
                                Rs.{' '}
                                {formatMoney(
                                  replacementTotal,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Difference
                              </span>

                              <strong>
                                {difference >
                                0
                                  ? `Additional Rs. ${formatMoney(
                                      difference,
                                    )}`
                                  : difference <
                                    0
                                  ? `Refund Rs. ${formatMoney(
                                      Math.abs(
                                        difference,
                                      ),
                                    )}`
                                  : 'Even Exchange'}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}

              {/* =================================================
                  PAYMENT / FINAL SUMMARY
              ================================================= */}

              <div className="card">
                <div className="card-header">
                  <div>
                    <h2>
                      Settlement
                    </h2>

                    <p>
                      Review the amounts before completing
                      the transaction.
                    </p>
                  </div>
                </div>

                <div className="summary-grid">
                  <div>
                    <span>
                      Returned Amount
                    </span>

                    <strong>
                      Rs.{' '}
                      {formatMoney(
                        totalReturnedAmount,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Replacement Amount
                    </span>

                    <strong>
                      Rs.{' '}
                      {formatMoney(
                        totalReplacementAmount,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Additional Payment
                    </span>

                    <strong>
                      Rs.{' '}
                      {formatMoney(
                        additionalPayment,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Refund Amount
                    </span>

                    <strong>
                      Rs.{' '}
                      {formatMoney(
                        refundAmount,
                      )}
                    </strong>
                  </div>
                </div>

                <div className="form-grid">
<div className="payment-method">
  <h4>Payment Method</h4>

  <div className="payment-method-radio-group">
    <label className="payment-method-radio-option">
      <input
        type="radio"
        name="return-payment-method"
        value="cash"
        checked={paymentMethod === 'cash'}
        onChange={(event) => setPaymentMethod(event.target.value)}
      />
      <span>Cash</span>
    </label>

    <label className="payment-method-radio-option">
      <input
        type="radio"
        name="return-payment-method"
        value="card"
        checked={paymentMethod === 'card'}
        onChange={(event) => setPaymentMethod(event.target.value)}
      />
      <span>Card</span>
    </label>
  </div>
</div>

                  <div className="form-group">
                    <label>
                      Note
                    </label>

                    <input
                      type="text"
                      value={note}
                      onChange={(event) =>
                        setNote(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Optional note"
                    />
                  </div>
                </div>

                <div className="final-action">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={
                      submitReturnExchange
                    }
                    disabled={loading}
                  >
                    {loading
                      ? 'Processing...'
                      : 'Complete Return / Exchange'}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default ReturnExchange;