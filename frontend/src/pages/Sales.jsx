import { useEffect, useState } from 'react';
import api from '../api/api';

function Sales() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
        'Failed to load sales',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // Search invoice number or product/dress name
  const filteredSales = sales.filter((sale) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    const invoiceNumber =
      sale.invoiceNumber?.toLowerCase() || '';

    const dressNames =
      sale.items
        ?.map((item) => item.dressName?.toLowerCase() || '')
        .join(' ') || '';

    return (
      invoiceNumber.includes(searchText) ||
      dressNames.includes(searchText)
    );
  });

  return (
    <div className="sales-page">

      <div className="sales-header">

        <div>
          <h2>Sales History</h2>
          <p>
            View all completed sales
          </p>
        </div>

        <button onClick={fetchSales}>
          Refresh
        </button>

      </div>

      {/* Search */}
      <div className="sales-search">

        <input
          type="text"
          placeholder="Search invoice number or dress name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
          >
            Clear
          </button>
        )}

      </div>

      {message && (
        <p className="sales-message">
          {message}
        </p>
      )}

      {loading ? (
        <p>Loading sales...</p>
      ) : (
        <div className="sales-table-container">

          <table className="sales-table">

            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>

              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    {search
                      ? 'No matching sales found'
                      : 'No sales found'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (

                  <tr key={sale._id}>

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
                        (item, index) => (
                          <div key={index}>
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
                      Rs. {sale.totalAmount}
                    </td>

                  </tr>

                ))
              )}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default Sales;