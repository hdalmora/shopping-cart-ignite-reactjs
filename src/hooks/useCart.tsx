import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stockResponse = await api.get(`/stock/${productId}`);
      const stock = stockResponse.data;

      const cartToUpdate = [...cart];

      const productAlreadyInCart = cartToUpdate.find(
        (product) => product.id === productId
      );

      const productCurrentAmount = productAlreadyInCart
        ? productAlreadyInCart.amount
        : 0;

      if (!stock || productCurrentAmount >= stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productAlreadyInCart) {
        productAlreadyInCart.amount += 1;
      } else {
        const product = await api.get(`/products/${productId}`);

        cartToUpdate.push({ ...product.data, amount: 1 });
      }
      setCart(cartToUpdate);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartToUpdate));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartToUpdate = [...cart];

      const productAlreadyInCart = cartToUpdate.find(
        (product) => product.id === productId
      );

      if (!productAlreadyInCart) {
        toast.error('Erro na remoção do produto');
      }

      const productToRemoveIndex = cartToUpdate
        .map(function (product) {
          return product.id;
        })
        .indexOf(productId);

      cartToUpdate.splice(productToRemoveIndex, 1);

      setCart(cartToUpdate);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartToUpdate));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const cartToUpdate = [...cart];

      const productAlreadyInCart = cartToUpdate.find(
        (product) => product.id === productId
      );

      const stockResponse = await api.get(`/stock/${productId}`);
      const stock = stockResponse.data;

      if (!stock || amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productAlreadyInCart) {
        productAlreadyInCart.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);
        cartToUpdate.push({ ...product.data, amount });
      }
      setCart(cartToUpdate);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartToUpdate));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
