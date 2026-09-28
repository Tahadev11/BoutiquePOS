import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';

function Receipt() {
  const { id } = useParams();

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const response = await api.get(
          `/sales/${id}`
        );

        setSale(response.data);
      } catch (error) {
        console.error(error);

        setMessage(
          error.response?.data?.message ||
          'Failed to load receipt'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  if (loading) {
    return <p>Loading receipt...</p>;
  }

  if (!sale) {
    return <p>{message || 'Receipt not found'}</p>;
  }

  return (
    <div className="receipt-page">

      <div className="receipt">

        {/* =========================
            HEADER
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

          <div className="receipt-heading-line"></div>

          <h2>SALES RECEIPT</h2>

        </div>


        {/* =========================
            SALE INFORMATION
        ========================= */}

        <div className="receipt-info">

          {/* INVOICE NUMBER */}

          <div className="receipt-info-row">
            <span>Invoice No</span>

            <strong>
              {sale.invoiceNumber}
            </strong>
          </div>


          {/* DATE */}

          <div className="receipt-info-row">
            <span>Date</span>

            <strong>
              {new Date(
                sale.createdAt
              ).toLocaleString()}
            </strong>
          </div>


          {/* PAYMENT */}

          <div className="receipt-info-row">
            <span>Payment</span>

            <strong>
              {sale.paymentMethod.toUpperCase()}
            </strong>
          </div>

        </div>


        <div className="receipt-divider"></div>


        {/* =========================
            PRODUCTS
        ========================= */}

        {sale.items.map((item, index) => {

          const salePrice =
            item.price -
            (
              item.price *
              item.discount /
              100
            );

          return (
            <div
              className="receipt-product-wrapper"
              key={index}
            >

              <div className="receipt-item">

                {/* LEFT SIDE */}

                <div className="receipt-item-left">

                  <strong className="receipt-product-name">
                    {item.dressName}
                  </strong>

                  <span>
                    Qty: {item.quantity}
                  </span>

                  <span>
                    Price: Rs. {item.price}
                  </span>

                  {item.discount > 0 && (
                    <span>
                      Discount: {item.discount}%
                    </span>
                  )}

                </div>


                {/* RIGHT SIDE */}

                <div className="receipt-item-right">

                  <strong className="receipt-sale-price-label">
                    Sale Price
                  </strong>

                  <span className="receipt-sale-price">
                    Rs. {salePrice.toFixed(2)}
                  </span>

                  <strong>
                    Rs. {item.subtotal}
                  </strong>

                </div>

              </div>


              {/* LINE BELOW PRODUCT */}

              {index < sale.items.length - 1 && (
                <div className="receipt-product-divider"></div>
              )}

            </div>
          );
        })}


        <div className="receipt-divider"></div>


        {/* =========================
            TOTAL
        ========================= */}

        <div className="receipt-total-row">

          <span>
            TOTAL
          </span>

          <strong>
            Rs. {sale.totalAmount}
          </strong>

        </div>


        <div className="receipt-divider"></div>


        {/* =========================
            FOOTER
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

          <div className="receipt-footer-line"></div>

          <p className="receipt-developed">
            Developed by Taha Siddique
          </p>

        </div>


        {/* =========================
            PRINT
        ========================= */}

        <button
          className="print-receipt-button"
          onClick={() => window.print()}
        >
          Print Receipt
        </button>

      </div>

    </div>
  );
}

export default Receipt;
