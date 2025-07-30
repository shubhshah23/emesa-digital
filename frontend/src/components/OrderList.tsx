import { useEffect, useState } from "react";
import { getOrders } from "../lib/api";

export default function OrderList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading orders...</div>;

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Orders</h2>
      <ul>
        {orders.map(order => (
          <li key={order.id} className="mb-2">
            <strong>{order.product_description}</strong> <br />
            Quantity: {order.quantity} <br />
            Status: {order.status} <br />
            Submitted: {new Date(order.date_submitted).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
} 