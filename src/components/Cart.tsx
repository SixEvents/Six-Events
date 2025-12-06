import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { useCart } from '../contexts/CartContext';
import { Separator } from './ui/separator';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Panier ({totalItems})</SheetTitle>
          <SheetDescription>
            Vos sélections pour réservation
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full pt-6">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Panier vide</h3>
              <p className="text-sm text-muted-foreground">
                Ajoutez des événements ou configurez une fête
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border rounded-lg dark:border-gray-700 transition-colors duration-200"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{item.name}</h4>
                      <Badge variant="outline" className="text-xs mb-2">
                        {item.type === 'event' ? 'Événement' : 'Party Builder'}
                      </Badge>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">{item.price}€</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-4 dark:border-gray-700 transition-colors duration-200">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{totalPrice.toFixed(2)}€</span>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/checkout')}
                >
                  Procéder au paiement
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Paiement sécurisé · Prix TTC
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
