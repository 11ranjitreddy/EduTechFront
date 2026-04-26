import React, { createContext, useState, useContext, useEffect } from 'react';
import { ENROLLMENT_URL } from '../config/api';
const CartContext = createContext();

export const useCart = () => useContext(CartContext);



// ✅ Helper to get token
const getToken = () => {
    const user = JSON.parse(localStorage.getItem('edtech_user'));
    return user?.accessToken || null;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('edtech_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

    useEffect(() => {
        localStorage.setItem('edtech_cart', JSON.stringify(cart));
    }, [cart]);

    // ✅ Fetch enrollments with token
    const fetchEnrollments = async (email) => {
        if (!email) return;
        try {
            const token = getToken();
            const response = await fetch(
                `${ENROLLMENT_URL}/my?studentEmail=${email}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            if (!response.ok) return;
            const data = await response.json();
            const ids = data.map(e => String(e.courseId));
            setEnrolledCourseIds(ids);
        } catch (err) {
            console.error('Failed to fetch enrollments:', err);
        }
    };

    const addToCart = (course) => {
        setCart((prevCart) => {
            if (prevCart.find(item => String(item.id) === String(course.id))) {
                return prevCart;
            }
            if (enrolledCourseIds.includes(String(course.id))) {
                return prevCart;
            }
            return [...prevCart, course];
        });
    };

    const removeFromCart = (courseId) => {
        setCart(prevCart =>
            prevCart.filter(item => String(item.id) !== String(courseId))
        );
    };

    const clearCart = () => setCart([]);

    const completePurchase = () => {
        const newPurchases = cart.map(course => ({
            ...course,
            progress: 0,
            purchasedAt: new Date().toISOString()
        }));
        setEnrolledCourseIds(prev => [
            ...prev,
            ...cart.map(c => String(c.id))
        ]);
        setCart([]);
        localStorage.removeItem('edtech_cart');
        return newPurchases;
    };

    // ✅ Update progress with token
    const updateCourseProgress = async (enrollmentId, progress) => {
        try {
            const token = getToken();
            await fetch(`${ENROLLMENT_URL}/${enrollmentId}/progress`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ progress })
            });
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    };

    const isCoursePurchased = (courseId) => {
        return enrolledCourseIds.includes(String(courseId));
    };

    const cartTotal = cart.reduce((total, item) => total + item.price, 0);
    const cartCount = cart.length;
    const purchasedCourses = enrolledCourseIds.map(id => ({ id }));

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            clearCart,
            cartTotal,
            cartCount,
            purchasedCourses,
            completePurchase,
            updateCourseProgress,
            isCoursePurchased,
            fetchEnrollments,
            enrolledCourseIds
        }}>
            {children}
        </CartContext.Provider>
    );
};