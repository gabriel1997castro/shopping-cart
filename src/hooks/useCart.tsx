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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const amountOnStock = await api.get(`stock/${productId}`)
        .then((res) => {
          const { status, data } = res
          if (status >= 200 && status < 300) {
            return data.amount
          } else throw Error()
        })

      const indexOfProduct = cart.findIndex(item => item.id === productId)
      const currAmount = indexOfProduct !== -1 ? cart[indexOfProduct].amount : 0

      if (amountOnStock >= currAmount + 1) {

        if (currAmount > 0) {
          const newCart = [...cart]
          newCart[indexOfProduct].amount += 1
          setCart(newCart)

        } else {
          const newCart = [...cart]
          const product = await api.get(`products/${productId}`)
            .then((res) => {
              const { status, data } = res
              if (status >= 200 && status < 300) {
                return data
              } else throw Error()
            })
          newCart.push({ ...product, amount: 1 })
          setCart(newCart)
        }
      } else {
        toast.error("Quantidade solicitada fora de estoque")
      }
    } catch {
      // TODO
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
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
