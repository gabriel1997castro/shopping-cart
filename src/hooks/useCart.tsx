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

const getAmountOnStock = async (productId: number) => {
  return api.get(`stock/${productId}`)
    .then((res) => {
      const { status, data } = res
      if (status >= 200 && status < 300) {
        return data.amount
      } else throw Error()
    })
}

const updateCartCache = (newCart: Product[]) => {
  localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
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
      const amountOnStock = await getAmountOnStock(productId)

      const indexOfProduct = cart.findIndex(item => item.id === productId)
      const currAmount = indexOfProduct !== -1 ? cart[indexOfProduct].amount : 0

      if (amountOnStock >= currAmount + 1) {

        if (currAmount > 0) {
          const newCart = [...cart]
          newCart[indexOfProduct].amount += 1
          setCart(newCart)
          updateCartCache(newCart)

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
          updateCartCache(newCart)
        }
      } else {
        toast.error("Quantidade solicitada fora de estoque")
      }
    } catch {
      toast.error("Erro na adição do produto")
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const indexOfProduct = cart.findIndex(item => item.id === productId)
      const newCart = [...cart]
      if (indexOfProduct !== -1) {
        newCart.splice(indexOfProduct, 1)
        setCart(newCart)
        updateCartCache(newCart)
      } else throw new Error()
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return

      const indexOfProduct = cart.findIndex(item => item.id === productId)
      const amountOnStock = await getAmountOnStock(productId)

      if (amountOnStock >= amount) {
        const newCart = [...cart]
        newCart[indexOfProduct].amount = amount
        setCart(newCart)
        updateCartCache(newCart)
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch (e) {
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
