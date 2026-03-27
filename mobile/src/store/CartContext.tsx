import React, { createContext, useContext, useState } from 'react';
import { showToast } from '../services/toast';
import { CartItem, Product } from '../types';

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getItemQuantity: (productId: string) => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast({
        type: 'error',
        title: 'Out of stock',
        message: `${product.name} is currently unavailable.`,
      });
      return;
    }

    let wasAdded = false;
    let stockExceeded = false;

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item._id === product._id);

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          stockExceeded = true;
          return currentItems;
        }

        wasAdded = true;
        return currentItems.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      wasAdded = true;
      return [...currentItems, { ...product, quantity: 1 }];
    });

    if (stockExceeded) {
      showToast({
        type: 'info',
        title: 'Stock limit reached',
        message: `Only ${product.stock} unit${product.stock === 1 ? '' : 's'} available.`,
      });
      return;
    }

    if (wasAdded) {
      showToast({
        type: 'success',
        title: 'Added to cart',
        message: product.name,
      });
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    let stockExceeded = false;

    setItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item._id !== productId) {
            return item;
          }

          const nextQuantity = Math.min(Math.max(quantity, 0), item.stock);

          if (quantity > item.stock) {
            stockExceeded = true;
          }

          return { ...item, quantity: nextQuantity };
        })
        .filter((item) => item.quantity > 0),
    );

    if (stockExceeded) {
      const item = items.find((entry) => entry._id === productId);

      showToast({
        type: 'info',
        title: 'Stock limit reached',
        message: item ? `Only ${item.stock} unit${item.stock === 1 ? '' : 's'} available.` : 'Cart updated.',
      });
    }
  };

  const removeFromCart = (productId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item._id !== productId));

    showToast({
      type: 'info',
      title: 'Removed from cart',
      message: 'Cart updated successfully.',
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const getItemQuantity = (productId: string) =>
    items.find((item) => item._id === productId)?.quantity || 0;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalAmount,
        addToCart,
        removeFromCart,
        updateQuantity,
        getItemQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
};
