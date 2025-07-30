
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, LogOut, ClipboardList, Factory, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardStats from "@/components/DashboardStats";
import OrderManagement from "@/components/OrderManagement";
import AdminSupplierManagement from "@/components/AdminSupplierManagement";
import Navbar from "@/components/Navbar";
import { getOrders, updateOrder, getOrderMessages } from "../lib/api";

interface User {
  id: string;
  email: string;
  role: 'client' | 'admin';
}

interface Order {
  id: number;
  client: number | { id: number; email: string };
  product_description: string;
  quantity: number;
  material_type: string;
  step_file: string;
  status: string;
  date_submitted: string;
  // Add more fields as needed
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard = ({ user, onLogout }: AdminDashboardProps) => {
  const [orders, setOrders] = useState<any[]>([]);
  const { toast } = useToast();
  const [latestCounterOffers, setLatestCounterOffers] = useState<{ [orderId: number]: { amount: number, sender: string } | null }>({});

  useEffect(() => {
    loadOrders();
  }, []);

  // Fetch latest counter offer for each negotiation order
  useEffect(() => {
    const fetchCounterOffers = async () => {
      const offers: { [orderId: number]: { amount: number, sender: string } | null } = {};
      for (const order of orders) {
        if (order.status === 'negotiation') {
          const messages = await getOrderMessages(order.id);
          const lastOffer = messages.filter((m: any) => m.type === 'counter_offer').sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          offers[order.id] = lastOffer ? { amount: lastOffer.amount, sender: lastOffer.sender_role } : null;
        }
      }
      setLatestCounterOffers(offers);
    };
    fetchCounterOffers();
  }, [orders]);

  const mapOrderForOrderManagement = (order: any): any => ({
    id: order.id,
    client_name: order.client_name || (order.client?.email ?? ""),
    client_company: order.client_company || (order.client?.company ?? ""),
    product_description: order.product_description,
    quantity: order.quantity,
    material_type: order.material_type,
    material_grade: order.material_grade || "",
    material_thickness: order.material_thickness || "",
    surface_treatment: order.surface_treatment || "",
    packing_standard: order.packing_standard || "",
    status: order.status === 'negotiation' ? 'quotation_sent' : order.status,
    date_submitted: order.date_submitted,
    expected_completion_date: order.expected_completion_date,
    machine_name: order.machine_name || (order.machine?.name ?? ""),
    supplier_name: order.supplier_name || (order.machine?.supplier?.name ?? ""),
    price_estimate: order.price_estimate,
    actual_cost: order.actual_cost,
    admin_notes: order.admin_notes,
    rejection_reason: order.rejection_reason,
    step_file_url: order.step_file_url,
    target_price: order.target_price,
    d2_draft_design_url: order.d2_draft_design_url,
    d2_draft_design: order.d2_draft_design,
    part_id: order.part_id || "",
    payment_confirmed: order.payment_confirmed || false,
    agreed_price: order.agreed_price || null
  });

  const loadOrders = async () => {
    try {
      const ordersData = await getOrders();
      setOrders(ordersData.map(mapOrderForOrderManagement));
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    }
  };

  const handleOrderAction = async (orderId: number, action: string) => {
    // Reload orders after any action to get updated data
    await loadOrders();
  };

  const handlePriceNegotiation = (orderId: number, counterOffer: number, notes: string) => {
    toast({
      title: "Counter Offer Sent",
      description: `Counter offer of $${counterOffer.toLocaleString()} sent to client for order ${orderId}.`,
    });
  };

  const handleMachineAssignment = (orderId: number, machineId: string, supplierId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, assignedMachine: machineId, assignedSupplier: supplierId }
        : order
    ));
    
    toast({
      title: "Machine Assigned",
      description: `Order ${orderId} has been assigned to a machine.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar 
        variant="admin" 
        onLogout={onLogout}
        userName={user.email}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <DashboardStats orders={orders} />

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">
              <span className="flex items-center justify-center">
                <ClipboardList className="h-4 w-4 mr-2" />
                Order Management
              </span>
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              <span className="flex items-center justify-center">
                <Factory className="h-4 w-4 mr-2" />
                Supplier Network
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="font-manrope">
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>
                  Manage order lifecycle from pending review to completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrderManagement 
                  orders={orders}
                  onOrderAction={handleOrderAction}
                  currentUser={user}
                  reloadOrders={loadOrders}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers">
            <AdminSupplierManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
