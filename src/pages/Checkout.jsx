import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

import { PAYMENT_URL } from '../config/api';

// ✅ SET THIS TO true WHEN CLIENT GIVES RAZORPAY KEYS
const USE_REAL_PAYMENT = true;

const Checkout = () => {
    const { cart, cartTotal, completePurchase, fetchEnrollments } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [mobile, setMobile] = useState('');
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // ✅ Load Razorpay script only if real payment enabled
    useEffect(() => {
        if (!USE_REAL_PAYMENT) {
            setScriptLoaded(true);
            return;
        }
        if (window.Razorpay) {
            setScriptLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => console.error('Failed to load Razorpay');
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    // ✅ Redirect if cart empty
    useEffect(() => {
        if (cart.length === 0) navigate('/cart');
    }, [cart]);

    // ✅ MOCK PAYMENT
    const handleMockPayment = async () => {
        setIsProcessing(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const token = user?.accessToken;

            // ✅ Enroll with token
            for (const course of cart) {
                await fetch('http://localhost:8082/api/v1/enrollments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        studentEmail: user.email,
                        courseId: Number(course.id)
                    })
                });
            }

            const purchasedItems = completePurchase();
            await fetchEnrollments(user.email, token);

            navigate('/order-success', {
                state: {
                    orderId: `ORD${Date.now()}`,
                    paymentId: `PAY${Date.now()}`,
                    amount: cartTotal,
                    courses: purchasedItems,
                    paymentMethod: 'Mock Payment'
                }
            });
        } catch (err) {
            console.error('Mock payment failed:', err);
            alert('Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // ✅ REAL RAZORPAY PAYMENT
    const handleRealPayment = async () => {
        if (!scriptLoaded) {
            alert('Payment gateway is loading. Please try again.');
            return;
        }
        setIsProcessing(true);
        try {
            const token = user?.accessToken;

            const orderRes = await fetch(`${PAYMENT_URL}/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    studentEmail: user.email,
                    amount: cartTotal,
                    courseIds: cart.map(c => Number(c.id))
                })
            });

            if (!orderRes.ok) throw new Error('Failed to create payment order');
            const orderData = await orderRes.json();

            const options = {
                key: orderData.keyId,
                amount: Math.round(orderData.amount * 100),
                currency: 'INR',
                name: 'EdTech Platform',
                description: `${cart.length} Course(s)`,
                order_id: orderData.orderId,

                handler: async (response) => {
                    try {
                        const verifyRes = await fetch(`${PAYMENT_URL}/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                                studentEmail: user.email,
                                courseIds: cart.map(c => Number(c.id))
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyData.success) {
                            const purchasedItems = completePurchase();
                            await fetchEnrollments(user.email, token);
                            navigate('/order-success', {
                                state: {
                                    orderId: response.razorpay_order_id,
                                    paymentId: response.razorpay_payment_id,
                                    amount: cartTotal,
                                    courses: purchasedItems,
                                    paymentMethod: 'Razorpay'
                                }
                            });
                        } else {
                            alert('❌ Payment verification failed. Please contact support.');
                            setIsProcessing(false);
                        }
                    } catch (err) {
                        console.error('Verification error:', err);
                        alert('Payment verification error. Please contact support.');
                        setIsProcessing(false);
                    }
                },

                prefill: {
                    name: `${firstName} ${lastName}`.trim() || user?.name || '',
                    email: user?.email || '',
                    contact: mobile || ''
                },

                theme: { color: '#4F46E5' },

                modal: {
                    ondismiss: () => setIsProcessing(false),
                    escape: true
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', (response) => {
                alert(`Payment failed: ${response.error.description}`);
                setIsProcessing(false);
            });
            razorpay.open();

        } catch (err) {
            console.error('Payment error:', err);
            alert('Payment failed. Please try again.');
            setIsProcessing(false);
        }
    };

    const handlePayment = () => {
        if (USE_REAL_PAYMENT) {
            handleRealPayment();
        } else {
            handleMockPayment();
        }
    };

    const discount = cart.reduce((acc, item) => {
        return acc + ((item.originalPrice || item.price) - item.price);
    }, 0);

    return (
        <div className="checkout-page container">
            <h1 className="page-title">Checkout</h1>

            {!USE_REAL_PAYMENT && (
                <div style={{
                    background: '#FEF3C7',
                    border: '1px solid #F59E0B',
                    borderRadius: '8px',
                    padding: '0.75rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#92400E'
                }}>
                    ⚠️ <strong>Test Mode:</strong> Payment is simulated. No real money will be charged.
                </div>
            )}

            <div className="checkout-layout">
                <div className="checkout-form-section">

                    {/* Billing Details */}
                    <section className="checkout-card">
                        <h2>Billing Details</h2>
                        <div className="billing-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        placeholder="John"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        placeholder="Doe"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    readOnly
                                    style={{ background: '#F9FAFB', cursor: 'not-allowed' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Mobile Number</label>
                                <input
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Payment Method */}
                    <section className="checkout-card">
                        <h2>Payment Method</h2>
                        <div style={{
                            padding: '2rem', textAlign: 'center',
                            background: '#F8FAFC', borderRadius: '12px',
                            border: '2px solid #EEF2FF'
                        }}>
                            {USE_REAL_PAYMENT ? (
                                <>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💳</div>
                                    <p style={{ fontWeight: '600', color: '#4F46E5', marginBottom: '0.5rem' }}>
                                        Secured by Razorpay
                                    </p>
                                    <div style={{
                                        display: 'flex', justifyContent: 'center',
                                        gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem'
                                    }}>
                                        {['UPI', 'Cards', 'NetBanking', 'Wallets'].map(m => (
                                            <span key={m} style={{
                                                background: 'white', border: '1px solid #E5E7EB',
                                                padding: '0.3rem 0.75rem', borderRadius: '6px',
                                                fontSize: '0.8rem', fontWeight: '500'
                                            }}>
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧪</div>
                                    <p style={{ fontWeight: '600', color: '#D97706', marginBottom: '0.25rem' }}>
                                        Test Mode Payment
                                    </p>
                                    <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
                                        Click pay to simulate a successful payment
                                    </p>
                                </>
                            )}
                        </div>
                    </section>

                    {/* Courses in Order */}
                    <section className="checkout-card">
                        <h2>Courses in Order</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {cart.map(item => (
                                <div key={item.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px'
                                }}>
                                    <div style={{
                                        width: '48px', height: '48px', background: '#4F46E5',
                                        borderRadius: '8px', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontWeight: '700',
                                        fontSize: '1.2rem', flexShrink: 0
                                    }}>
                                        {item.title?.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                            {item.title}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                                            by {item.instructor}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '700', color: '#4F46E5' }}>
                                        ₹{item.price}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right - Order Summary */}
                <div className="checkout-summary-section">
                    <section className="checkout-card summary-card" style={{
                        position: 'sticky', top: '2rem'
                    }}>
                        <h3>Order Summary</h3>
                        <div className="order-items">
                            {cart.map(item => (
                                <div key={item.id} className="order-item">
                                    <span style={{
                                        fontSize: '0.9rem', flex: 1,
                                        paddingRight: '1rem', color: '#374151'
                                    }}>
                                        {item.title}
                                    </span>
                                    <span style={{ fontWeight: '600' }}>₹{item.price}</span>
                                </div>
                            ))}
                        </div>

                        <div className="summary-divider"></div>

                        {discount > 0 && (
                            <div className="summary-row" style={{
                                color: '#10B981', fontWeight: '600'
                            }}>
                                <span>You Save</span>
                                <span>- ₹{discount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="summary-row total">
                            <span>Total</span>
                            <span style={{ color: '#4F46E5', fontSize: '1.3rem' }}>
                                ₹{cartTotal.toFixed(2)}
                            </span>
                        </div>

                        <div className="summary-divider"></div>

                        <button
                            onClick={handlePayment}
                            disabled={isProcessing || cart.length === 0}
                            style={{
                                width: '100%', padding: '1rem',
                                background: isProcessing
                                    ? '#9CA3AF'
                                    : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                color: 'white', border: 'none',
                                borderRadius: '10px', fontSize: '1.05rem',
                                fontWeight: '700',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                marginBottom: '1rem', transition: 'all 0.2s',
                                boxShadow: '0 4px 15px rgba(79,70,229,0.3)'
                            }}
                        >
                            {isProcessing
                                ? '⏳ Processing...'
                                : USE_REAL_PAYMENT
                                ? `🔒 Pay ₹${cartTotal.toFixed(2)}`
                                : `✅ Complete Purchase ₹${cartTotal.toFixed(2)}`}
                        </button>

                        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#9CA3AF' }}>
                            🔒 100% Secure • SSL Encrypted
                        </div>

                        <div style={{
                            marginTop: '1.5rem', padding: '1rem',
                            background: '#F0FDF4', borderRadius: '8px',
                            border: '1px solid #BBF7D0'
                        }}>
                            <p style={{
                                fontWeight: '600', color: '#166534',
                                marginBottom: '0.5rem', fontSize: '0.9rem'
                            }}>
                                ✅ What you get:
                            </p>
                            {[
                                'Lifetime access to course',
                                'Certificate of completion',
                                'Access on all devices',
                                '30-day money back guarantee'
                            ].map((item, i) => (
                                <div key={i} style={{
                                    fontSize: '0.82rem',
                                    color: '#15803D', marginBottom: '0.25rem'
                                }}>
                                    • {item}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Checkout;