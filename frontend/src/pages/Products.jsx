
import { useEffect, useState } from 'react';
import api from '../api/api';

function Products() {
  // =========================================================
  // STATE
  // =========================================================

  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [deleteProductId, setDeleteProductId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [form, setForm] = useState({
    dressName: '',
    category: '',
    brand: '',
    size: '',
    color: '',
    actualPrice: '',
    discount: '',
    purchasePrice: '',
    stockQuantity: '',
  });

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  // =========================================================
  // FETCH ALL PRODUCTS
  // =========================================================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await api.get('/products');

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setAllProducts(data);
      setProducts(data);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
        'Failed to load products'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);


  // =========================================================
  // TOTAL DRESSES AND TOTAL STOCK
  // =========================================================

  // Calculate totals from the currently displayed products.
  const totalDresses = products.length;

  const totalStock = products.reduce(
    (total, product) =>
      total + (Number(product.stockQuantity) || 0),
    0
  );


  // =========================================================
  // FORM HANDLING
  // =========================================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm({
      dressName: '',
      category: '',
      brand: '',
      size: '',
      color: '',
      actualPrice: '',
      discount: '',
      purchasePrice: '',
      stockQuantity: '',
    });

    setEditingId(null);
  };

  // =========================================================
  // ADD / UPDATE PRODUCT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const productData = {
        dressName: form.dressName,
        category: form.category,
        brand: form.brand,
        size: form.size,
        color: form.color,
        actualPrice: Number(form.actualPrice),
        discount: Number(form.discount),
        purchasePrice: Number(form.purchasePrice),
        stockQuantity: Number(form.stockQuantity),
      };

      if (editingId) {
        await api.patch(
          `/products/${editingId}`,
          productData
        );

        setMessage('Dress updated successfully');
      } else {
        await api.post('/products', productData);

        setMessage('Dress added successfully');
      }

      resetForm();
      await fetchProducts();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
        'Operation failed'
      );
    }
  };

  // =========================================================
  // EDIT PRODUCT
  // =========================================================

  const handleEdit = (product) => {
    setEditingId(product._id);

    setForm({
      dressName: product.dressName ?? '',
      category: product.category ?? '',
      brand: product.brand ?? '',
      size: product.size ?? '',
      color: product.color ?? '',
      actualPrice: product.actualPrice ?? '',
      discount: product.discount ?? '',
      purchasePrice: product.purchasePrice ?? '',
      stockQuantity: product.stockQuantity ?? '',
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);

      setMessage('Dress deleted successfully');

      await fetchProducts();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
        'Failed to delete dress'
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteProductId) {
      return;
    }

    await handleDelete(deleteProductId);

    setShowDeleteModal(false);
    setDeleteProductId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteProductId(null);
  };

  // =========================================================
  // FLEXIBLE SEARCH
  // =========================================================

  const handleSearch = (value = search) => {
    const query = value.trim().toLowerCase();

    // Show the complete inventory when the search is empty.
    if (!query) {
      setProducts(allProducts);
      return;
    }

    const filteredProducts = allProducts.filter(
      (product) => {
        const actualPrice =
          Number(product.actualPrice) || 0;

        const discount =
          Number(product.discount) || 0;

        const salePrice =
          actualPrice - (actualPrice * discount) / 100;

        const searchableValues = [
          product.dressName,
          product.category,
          product.brand,
          product.size,
          product.color,
          product.actualPrice,
          discount,
          salePrice,
          product.purchasePrice,
          product.stockQuantity,
        ];

        return searchableValues.some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(query)
        );
      }
    );

    setProducts(filteredProducts);
  };

  // =========================================================
  // CLEAR SEARCH
  // =========================================================

  const handleShowAll = () => {
    setSearch('');
    setProducts(allProducts);
  }

  return (
    <div className="products-page">
      {/* PAGE HEADER AND SUMMARY CARDS */}

      <div className="products-header">
        <h2>Dresses</h2>

        <div className="products-summary-cards">
          <div className="total-dresses-card">
            <span className="total-dresses-label">
              Total Dresses
            </span>

            <span className="total-dresses-count">
              {totalDresses}
            </span>
          </div>

          <div className="total-stock-card">
            <span className="total-dresses-label">
              Total Stock
            </span>

            <span className="total-dresses-count">
              {totalStock}
            </span>
          </div>
        </div>
      </div>

      {/* MESSAGE */}

      {message && (
        <p className="products-message" role="status">
          {message}
        </p>
      )}

      {/* ADD / EDIT FORM */}

      <div className="product-form-box">
        <h3>
          {editingId ? 'Update Dress' : 'Add New Dress'}
        </h3>

        <form onSubmit={handleSubmit}>
          <input
            name="dressName"
            placeholder="Dress Name"
            value={form.dressName}
            onChange={handleChange}
            required
          />

          <input
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleChange}
            required
          />

          <input
            name="brand"
            placeholder="Brand"
            value={form.brand}
            onChange={handleChange}
            required
          />

          <input
            name="size"
            placeholder="Size"
            value={form.size}
            onChange={handleChange}
            required
          />

          <input
            name="color"
            placeholder="Color"
            value={form.color}
            onChange={handleChange}
            required
          />

          <input
            name="actualPrice"
            type="number"
            min="0"
            placeholder="Actual Price"
            value={form.actualPrice}
            onChange={handleChange}
            required
          />

          <input
            name="discount"
            type="number"
            min="0"
            max="100"
            placeholder="Discount %"
            value={form.discount}
            onChange={handleChange}
            required
          />

          <input
            name="purchasePrice"
            type="number"
            min="0"
            placeholder="Purchase Price"
            value={form.purchasePrice}
            onChange={handleChange}
            required
          />

          <input
            name="stockQuantity"
            type="number"
            min="0"
            placeholder="Stock Quantity"
            value={form.stockQuantity}
            onChange={handleChange}
            required
          />

          <button type="submit">
            {editingId ? 'Update Dress' : 'Add Dress'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* FLEXIBLE SEARCH */}

      <div className="product-search">
        <input
          type="text"
          placeholder="Search by dress, brand, category, size, color, price or stock..."
          value={search}
          onChange={(e) => {
            const value = e.target.value;

            setSearch(value);
            handleSearch(value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
        />

        <button
          type="button"
          onClick={() => handleSearch()}
        >
          Search
        </button>

        <button
          type="button"
          onClick={handleShowAll}
        >
          Show All
        </button>
      </div>

      {/* PRODUCTS TABLE */}

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Dress</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Size</th>
                <th>Color</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Sale Price</th>
                <th>Purchase Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="11">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const actualPrice =
                    Number(product.actualPrice) || 0;

                  const discount =
                    Number(product.discount) || 0;

                  const salePrice =
                    actualPrice -
                    (actualPrice * discount) / 100;

                  return (
                    <tr key={product._id}>
                      <td>{product.dressName}</td>

                      <td>{product.category}</td>

                      <td>{product.brand}</td>

                      <td>{product.size}</td>

                      <td>{product.color}</td>

                      <td>Rs. {actualPrice}</td>

                      <td>{discount}%</td>

                      <td>
                        Rs. {Number(salePrice.toFixed(2))}
                      </td>

                      <td>
                        Rs. {Number(product.purchasePrice) || 0}
                      </td>

                      <td>
                        {Number(product.stockQuantity) || 0}
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteProductId(product._id);
                            setShowDeleteModal(true);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}

      {showDeleteModal && (
        <div
          className="delete-modal-overlay"
          onClick={cancelDelete}
        >
          <div
            className="delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-icon">
              🗑️
            </div>

            <h2>Delete Dress?</h2>

            <p>
              Are you sure you want to delete this dress?
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="cancel-delete-btn"
                onClick={cancelDelete}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete-btn"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
