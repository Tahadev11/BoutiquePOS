import { useEffect, useState } from 'react';
import api from '../api/api';

function Products() {
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
    stockQuantity: '',
  });

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await api.get('/products');

      setProducts(response.data);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Failed to load products',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      stockQuantity: '',
    });

    setEditingId(null);
  };

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
        stockQuantity: Number(form.stockQuantity),
      };

      if (editingId) {
        await api.patch(
          `/products/${editingId}`,
          productData,
        );

        setMessage('Dress updated successfully');
      } else {
        await api.post(
          '/products',
          productData,
        );

        setMessage('Dress added successfully');
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Operation failed',
      );
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);

    setForm({
      dressName: product.dressName,
      category: product.category,
      brand: product.brand,
      size: product.size,
      color: product.color,
      actualPrice: product.actualPrice,
      discount: product.discount,
      stockQuantity: product.stockQuantity,
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);

      setMessage('Dress deleted successfully');

      fetchProducts();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Failed to delete dress',
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

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchProducts();
      return;
    }

    try {
      const response = await api.get(
        `/products/search?q=${encodeURIComponent(search)}`,
      );

      setProducts(response.data);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          'Search failed',
      );
    }
  };

  return (
    <div className="products-page">

      <h2>Products</h2>

      {message && (
        <p className="products-message">
          {message}
        </p>
      )}

      {/* Add / Edit Form */}

      <div className="product-form-box">

        <h3>
          {editingId
            ? 'Update Dress'
            : 'Add New Dress'}
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
            name="stockQuantity"
            type="number"
            min="0"
            placeholder="Stock Quantity"
            value={form.stockQuantity}
            onChange={handleChange}
            required
          />

          <button type="submit">
            {editingId
              ? 'Update Dress'
              : 'Add Dress'}
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

      {/* Search */}

      <div className="product-search">

        <input
          type="text"
          placeholder="Search dress or category..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />

        <button onClick={handleSearch}>
          Search
        </button>

        <button
          onClick={() => {
            setSearch('');
            fetchProducts();
          }}
        >
          Show All
        </button>

      </div>

      {/* Products */}

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
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {products.length === 0 ? (
                <tr>
                  <td colSpan="10">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => {

                  const salePrice =
                    product.actualPrice -
                    (
                      product.actualPrice *
                      product.discount /
                      100
                    );

                  return (
                    <tr key={product._id}>

                      <td>
                        {product.dressName}
                      </td>

                      <td>
                        {product.category}
                      </td>

                      <td>
                        {product.brand}
                      </td>

                      <td>
                        {product.size}
                      </td>

                      <td>
                        {product.color}
                      </td>

                      <td>
                        Rs. {product.actualPrice}
                      </td>

                      <td>
                        {product.discount}%
                      </td>

                      <td>
                        Rs. {salePrice}
                      </td>

                      <td>
                        {product.stockQuantity}
                      </td>

                      <td>

                        <button
                          onClick={() =>
                            handleEdit(product)
                          }
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            setDeleteProductId(
                              product._id,
                            );
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

      {/* Delete Confirmation Modal */}

      {showDeleteModal && (
        <div
          className="delete-modal-overlay"
          onClick={cancelDelete}
        >

          <div
            className="delete-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="delete-modal-icon">
              🗑️
            </div>

            <h2>
              Delete Dress?
            </h2>

            <p>
              Are you sure you want to
              delete this dress?
            </p>

            <div className="delete-modal-actions">

              <button
                className="cancel-delete-btn"
                onClick={cancelDelete}
              >
                Cancel
              </button>

              <button
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
