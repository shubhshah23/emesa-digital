
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Play, Package, Clock, AlertCircle, FileText, DollarSign, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { approveOrder, rejectOrder, startProduction, completeOrder, assignMachine, getAvailableMachines, sendCounterOffer } from "../lib/api";
import OrderChatModal from "./OrderChatModal";
import { getOrderMessages } from "../lib/api";

interface Order {
  id: number;
  client_name: string;
  client_company: string;
  product_description: string;
  quantity: number;
  material_type: string;
  material_grade: string;
  status: string;
  date_submitted: string;
  expected_completion_date?: string;
  machine_name?: string;
  supplier_name?: string;
  price_estimate?: number;
  actual_cost?: number;
  admin_notes?: string;
  rejection_reason?: string;
  target_price?: number;
  step_file_url?: string;
  d2_draft_design_url?: string;
  d2_draft_design?: string; // Added d2_draft_design to the interface
  payment_confirmed?: boolean; // Added payment_confirmed to the interface
  machine?: number; // Added machine to the interface
  part_id?: string; // Added part_id to the interface
  material_thickness?: string; // Added material_thickness to the interface
  surface_treatment?: string; // Added surface_treatment to the interface
  packing_standard?: string; // Added packing_standard to the interface
}

interface Machine {
  id: number;
  name: string;
  type: string;
  supplier_name: string;
  is_available: boolean;
}

interface OrderManagementProps {
  orders: Order[];
  onOrderAction: (orderId: number, action: string) => void;
  currentUser: { id: string; email: string; role: string };
  reloadOrders: () => void;
}

const OrderManagement = ({ orders, onOrderAction, currentUser, reloadOrders }: OrderManagementProps) => {
  console.log('OrderManagement component rendered');
  console.log('orders prop:', orders);
  console.log('Orders with part_id:', orders.filter(o => o.part_id).map(o => ({ id: o.id, part_id: o.part_id, status: o.status })));
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [chatOrderId, setChatOrderId] = useState<number | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [showProductionModal, setShowProductionModal] = useState<number | null>(null);
  const [productionMachineId, setProductionMachineId] = useState<number | null>(null);
  const [productionDate, setProductionDate] = useState<string>("");
  const [expandedOrders, setExpandedOrders] = useState<{ [orderId: number]: boolean }>({});
  const ORDERS_PER_PAGE = 5;
  const [pagination, setPagination] = useState<{ [tab: string]: number }>({});
  const [latestCounterOffers, setLatestCounterOffers] = useState<{ [orderId: number]: { sender: 'client' | 'admin'; amount: number; admin_notes?: string } }>({});

  useEffect(() => {
    loadMachines();
    // Poll for orders and machines every 1 second
    pollingRef.current = setInterval(() => {
      reloadOrders();
      loadMachines();
    }, 1000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchCounterOffers = async () => {
      const offers: { [orderId: number]: { sender: 'client' | 'admin'; amount: number; admin_notes?: string } } = {};
      for (const order of orders) {
        if (["negotiation", "quotation_sent", "awaiting_payment"].includes(order.status)) {
          const messages = await getOrderMessages(order.id);
          const lastOffer = messages
            .filter((m: any) => m.type === 'counter_offer')
            .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          if (lastOffer) {
            offers[order.id] = {
              sender: lastOffer.sender_role === 'admin' ? 'admin' : 'client',
              amount: lastOffer.amount,
              admin_notes: lastOffer.admin_notes,
            };
          }
        }
      }
      setLatestCounterOffers(offers);
    };
    fetchCounterOffers();
  }, [orders]);

  const loadMachines = async () => {
    try {
      const availableMachines = await getAvailableMachines();
      setMachines(availableMachines);
    } catch (error) {
      console.error('Error loading machines:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'under_review':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_production':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <Package className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Use neutral colors like client dashboard
  const getStatusColor = (status: string) => {
    return 'bg-gray-100 text-black';
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'under_review':
        return 'Order is under review by admin team.';
      case 'accepted':
        return 'Order has been approved and is ready for production.';
      case 'in_production':
        return 'Order is currently being manufactured.';
      case 'completed':
        return 'Order has been completed and is ready for delivery.';
      case 'rejected':
        return 'Order has been rejected. Please check the rejection reason below.';
      default:
        return 'Order status unknown.';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handlePageChange = (tab: string, page: number) => {
    setPagination(prev => ({
      ...prev,
      [tab]: page
    }));
  };

  const handleAction = async (order: Order, action: string) => {
    // For 'complete', immediately submit without modal
    if (action === 'complete') {
      setSelectedOrder(order);
      setActionType(action);
      setFormData({});
      setIsDialogOpen(false);
      setLoading(true);
      try {
        await completeOrder(order.id);
        toast({ title: "Order Completed", description: "Order has been marked as completed." });
        onOrderAction(order.id, action);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.error || "An error occurred",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
      return;
    }
    setSelectedOrder(order);
    setActionType(action);
    setFormData({});
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedOrder) return;
    
    setLoading(true);
    try {
      switch (actionType) {
        case 'approve':
          // Always set status to 'quotation_sent' when approving (Accept at Target Price)
          await approveOrder(selectedOrder.id, formData);
          toast({ title: "Order Approved", description: "Order has been approved and moved to Quotation Sent." });
          selectedOrder.status = 'quotation_sent';
          break;
        case 'reject':
          await rejectOrder(selectedOrder.id, formData.rejection_reason);
          toast({ title: "Order Rejected", description: "Order has been rejected." });
          break;
        case 'start_production':
          await startProduction(selectedOrder.id);
          toast({ title: "Production Started", description: "Production has been started." });
          break;
        case 'complete':
          await completeOrder(selectedOrder.id, formData.actual_cost);
          toast({ title: "Order Completed", description: "Order has been marked as completed." });
          break;
        case 'assign_machine':
          await assignMachine(selectedOrder.id, formData.machine_id);
          toast({ title: "Machine Assigned", description: "Machine has been assigned to the order." });
          break;
        case 'counter_offer':
          await sendCounterOffer(selectedOrder.id, formData.counter_offer_amount, formData.admin_notes);
          toast({ title: "Counter Offer Sent", description: "Counter offer has been sent to the client." });
          // Simulate status change to 'quotation_sent'
          selectedOrder.status = 'quotation_sent';
          break;
        case 'accept_target_price':
          // Admin accepts at target price, move to awaiting_payment
          await approveOrder(selectedOrder.id, formData);
          toast({ title: "Order Accepted at Target Price", description: "Order is now awaiting payment." });
          selectedOrder.status = 'awaiting_payment';
          break;
        case 'accept_counter_offer':
          await approveOrder(selectedOrder.id, formData);
          toast({ title: "Counter Offer Accepted", description: "Order is now awaiting payment." });
          selectedOrder.status = 'awaiting_payment';
          break;
      }
      setIsDialogOpen(false);
      onOrderAction(selectedOrder.id, actionType);
      reloadOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartProduction = (order: Order) => {
    setShowProductionModal(order.id);
    setProductionMachineId(order.machine ? order.machine : null);
    setProductionDate(new Date().toISOString().slice(0, 10));
  };
  const handleConfirmProduction = async (order: Order) => {
    try {
      if (!productionMachineId) {
        toast({ title: "Error", description: "Please select a machine.", variant: "destructive" });
        return;
      }
      // Assign machine if changed or not assigned
      if (!order.machine || order.machine !== productionMachineId) {
        await assignMachine(order.id, productionMachineId);
      }
      // Call startProduction (optionally send productionDate if backend supports it)
      await startProduction(order.id);
      toast({ title: "Production Started", description: "Order moved to production." });
      setShowProductionModal(null);
      reloadOrders();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.error || "An error occurred", variant: "destructive" });
    }
  };

  const renderActionDialog = () => {
    if (!selectedOrder) return null;

    switch (actionType) {
      case 'approve':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="expected_completion_date">Expected Completion Date</Label>
              <Input
                type="date"
                onChange={(e) => setFormData({...formData, expected_completion_date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="price_estimate">Price Estimate (₹)</Label>
              <Input
                id="price_estimate"
                type="number"
                value={selectedOrder?.target_price || ''}
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="admin_notes">Admin Notes</Label>
              <Textarea
                placeholder="Add any notes for the client"
                onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
              />
            </div>
          </div>
        );

      case 'reject':
        return (
          <div>
            <Label htmlFor="rejection_reason">Rejection Reason</Label>
            <Textarea
              placeholder="Please provide a reason for rejection"
              onChange={(e) => setFormData({...formData, rejection_reason: e.target.value})}
              required
            />
          </div>
        );

      case 'complete':
        // Remove the actual cost modal/input for completion
        return null;

      case 'assign_machine':
        return (
          <div>
            <Label htmlFor="machine_id">Select Machine</Label>
            <Select onValueChange={(value) => setFormData({...formData, machine_id: parseInt(value)})}>
              <SelectTrigger>
                <SelectValue placeholder="Select a machine" />
              </SelectTrigger>
              <SelectContent>
                {machines.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id.toString()}>
                    {machine.name} - {machine.supplier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'counter_offer':
        return (
          <div>
            <Label htmlFor="counter_offer_amount">Counter Offer Amount</Label>
            <Input
              id="counter_offer_amount"
              type="number"
              placeholder="Enter counter offer amount"
              onChange={(e) => setFormData({ ...formData, counter_offer_amount: parseFloat(e.target.value) })}
              required
            />
            <Label htmlFor="admin_notes">Admin Notes (optional)</Label>
            <Textarea
              id="admin_notes"
              placeholder="Add any notes for the client"
              onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const getActionButton = (order: Order) => {
    // Only show Start Production if status is 'accepted'
    if (order.status === 'accepted') {
      return (
        <Button
          size="sm"
          className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
          onClick={() => handleStartProduction(order)}
        >
          <Play className="h-4 w-4 mr-1" />
          Start Production
        </Button>
      );
    }
    // Only show Mark Complete if status is 'in_production'
    if (order.status === 'in_production') {
      return (
        <Button
          size="sm"
          className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
          onClick={() => handleAction(order, 'complete')}
        >
          <Package className="h-4 w-4 mr-1" />
          Mark Complete
        </Button>
      );
    }
    // Only show Payment Confirmed badge if payment is confirmed and not in accepted/in_production/completed
    if (order.payment_confirmed && !['accepted', 'in_production', 'completed'].includes(order.status)) {
      return <span className="text-green-600 font-semibold">Payment Confirmed</span>;
    }
    if (order.status === 'under_review') {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
            onClick={() => handleAction(order, 'approve')}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Accept at Target Price
          </Button>
          <Button
            size="sm"
            className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
            onClick={() => handleAction(order, 'reject')}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
            onClick={() => handleAction(order, 'counter_offer')}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Counter Offer
          </Button>
        </div>
      );
    }
    switch (order.status) {
      case 'negotiation':
        return (
          <div className="flex gap-2">
            {latestCounterOffers[order.id]?.sender === 'client' && (
              <Button
                size="sm"
                className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
                onClick={() => handleAction(order, 'accept_counter_offer')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept Counter Offer
              </Button>
            )}
            <Button
              size="sm"
              className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
              onClick={() => handleAction(order, 'reject')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            {latestCounterOffers[order.id]?.sender === 'client' && (
              <Button
                size="sm"
                className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
                onClick={() => handleAction(order, 'counter_offer')}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Counter Offer
              </Button>
            )}
          </div>
        );
      case 'under_review':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
              onClick={() => handleAction(order, 'approve')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept at Target Price
            </Button>
            <Button
              size="sm"
              className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
              onClick={() => handleAction(order, 'reject')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
              onClick={() => handleAction(order, 'counter_offer')}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Counter Offer
            </Button>
          </div>
        );
      case 'awaiting_payment':
        return null;
      default:
        return null;
    }
  };

  const filterOrdersByStatus = (status: string) => {
    if (status === 'quotation_sent') {
      return orders.filter(order => order.status === 'quotation_sent');
    }
    return orders.filter(order => order.status === status);
  };

  const getPaginatedOrders = (status: string) => {
    const filteredOrders = filterOrdersByStatus(status);
    const currentPage = pagination[status] || 1;
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE);
  };

  const getTotalPages = (status: string) => {
    return Math.ceil(filterOrdersByStatus(status).length / ORDERS_PER_PAGE);
  };

  return (
    <>
      <Tabs defaultValue="under_review" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="under_review" className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-2" />
            Under Review ({filterOrdersByStatus('under_review').length})
          </TabsTrigger>
          <TabsTrigger value="quotation_sent" className="flex items-center justify-center">
            <FileText className="h-4 w-4 mr-2" />
            Quotation Sent ({filterOrdersByStatus('quotation_sent').length})
          </TabsTrigger>
          <TabsTrigger value="awaiting_payment" className="flex items-center justify-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Awaiting Payment ({filterOrdersByStatus('awaiting_payment').length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="flex items-center justify-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Accepted ({filterOrdersByStatus('accepted').length})
          </TabsTrigger>
          <TabsTrigger value="in_production" className="flex items-center justify-center">
            <Play className="h-4 w-4 mr-2" />
            In Production ({filterOrdersByStatus('in_production').length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center justify-center">
            <Package className="h-4 w-4 mr-2" />
            Completed ({filterOrdersByStatus('completed').length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center justify-center">
            <XCircle className="h-4 w-4 mr-2" />
            Rejected ({filterOrdersByStatus('rejected').length})
          </TabsTrigger>
        </TabsList>

        {['under_review', 'quotation_sent', 'awaiting_payment', 'accepted', 'in_production', 'completed', 'rejected'].map((status) => (
          <TabsContent key={status} value={status}>
            <div className="space-y-4">
              {getPaginatedOrders(status).map((order) => {
                console.log(`Rendering order ${order.id} with status ${order.status} in tab ${status}, part_id: ${order.part_id}`);
                return (
                <Card className="border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow mb-4" key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-3 text-gray-900 text-lg font-semibold">
                          Order #{order.id}
                          <div className="inline-flex items-center px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-black uppercase">
                            {order.status.replace('_', ' ')}
                          </div>
                        </CardTitle>
                        <div className="text-xs text-gray-400 mt-1">
                          Part ID: <span className="font-mono text-red-500 font-bold">{order.part_id || '—'}</span>
                          {/* Debug: {JSON.stringify({ part_id: order.part_id, type: typeof order.part_id })} */}
                        </div>
                        <CardDescription className="mt-2">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-gray-500">
                              <Calendar className="h-4 w-4" />
                              Submitted: {formatDate(order.date_submitted)}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      <button
                        className={`ml-4 mt-2 p-1 rounded-full transition-transform bg-transparent` + (expandedOrders[order.id] ? ' rotate-180' : '')}
                        aria-label={expandedOrders[order.id] ? 'Hide Details' : 'Show Details'}
                        onClick={() => toggleOrderExpand(order.id)}
                        style={{ alignSelf: 'center' }}
                      >
                        <ChevronDown className="h-6 w-6 text-black" />
                      </button>
                    </div>
                  </CardHeader>
                  
                  {expandedOrders[order.id] && (
                    <CardContent className="pt-0">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-800">
                            <FileText className="h-4 w-4" />
                            Product Details
                          </h4>
                          <div className="space-y-2 text-sm text-gray-700">
                            <p><span className="font-medium">Description:</span> {order.product_description}</p>
                            <p><span className="font-medium">Quantity:</span> {order.quantity}</p>
                            <p><span className="font-medium">Material Type:</span> {order.material_type}</p>
                            <p><span className="font-medium">Material Grade:</span> {order.material_grade}</p>
                            <p><span className="font-medium">Material Thickness:</span> {order.material_thickness}</p>
                            <p><span className="font-medium">Surface Treatment:</span> {order.surface_treatment}</p>
                            <p><span className="font-medium">Packing Standard:</span> {order.packing_standard}</p>
                            <p><span className="font-medium">Target Price:</span> {order.target_price ? `₹${order.target_price}` : '—'}</p>
                            <p><span className="font-medium">Part ID:</span> <span className="font-mono">{order.part_id || '—'}</span></p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-800">
                            <Package className="h-4 w-4" />
                            Production Details
                          </h4>
                          <div className="space-y-2 text-sm text-gray-700">
                            {order.machine_name && (
                              <p><span className="font-medium">Assigned Machine:</span> {order.machine_name}</p>
                            )}
                            {order.supplier_name && (
                              <p><span className="font-medium">Supplier:</span> {order.supplier_name}</p>
                            )}
                            {order.actual_cost && (
                              <p><span className="font-medium">Actual Cost:</span> ₹{order.actual_cost}</p>
                            )}
                            {order.admin_notes && (
                              <p><span className="font-medium">Admin Notes:</span> {order.admin_notes}</p>
                            )}
                            {order.rejection_reason && (
                              <p><span className="font-medium">Rejection Reason:</span> {order.rejection_reason}</p>
                            )}
                          </div>
                        </div>
                      </div>
                        
                      {getActionButton(order) && (
                        <div className="flex gap-2 pt-2">
                          {getActionButton(order)}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        {order.step_file_url && (
                          <a href={order.step_file_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-[#76B900] hover:bg-[#5ea200] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors">
                              <FileText className="h-4 w-4 mr-1" />
                              View STEP File
                            </Button>
                          </a>
                        )}
                        {order.d2_draft_design_url && (
                          <a href={order.d2_draft_design_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-[#76B900] hover:bg-[#5ea200] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors">
                              <FileText className="h-4 w-4 mr-1" />
                              View Draft Design
                            </Button>
                          </a>
                        )}
                        {/* <Button variant="outline" size="sm" onClick={() => setChatOrderId(order.id)}>
                          💬 Chat
                        </Button> */}
                      </div>
                    </CardContent>
                  )}
                  {['negotiation', 'quotation_sent', 'awaiting_payment'].includes(order.status) && latestCounterOffers[order.id] && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-md">
                      <div className="font-medium text-yellow-800">
                        Latest Counter Offer: ₹{latestCounterOffers[order.id].amount} (from {latestCounterOffers[order.id].sender === 'admin' ? 'Admin' : 'Client'})
                      </div>
                      {latestCounterOffers[order.id].admin_notes && (
                        <div className="text-sm text-yellow-700 mt-1">Note: {latestCounterOffers[order.id].admin_notes}</div>
                      )}
                      {/* Show admin actions if latest is from client and order is actionable */}
                      {latestCounterOffers[order.id].sender === 'client' && !['completed','rejected','accepted','in_production'].includes(order.status) && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
                            onClick={() => handleAction(order, 'accept_counter_offer')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept Counter Offer
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
                            onClick={() => handleAction(order, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#2046b3] hover:bg-[#183488] text-white font-semibold rounded-lg px-6 py-2 text-[15px] transition-colors"
                            onClick={() => handleAction(order, 'counter_offer')}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Counter Offer
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
              
              {getPaginatedOrders(status).length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No orders in this status</p>
                  </CardContent>
                </Card>
              )}

              {/* Pagination */}
              {getTotalPages(status) > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(status, (pagination[status] || 1) - 1)}
                    disabled={(pagination[status] || 1) === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination[status] || 1} of {getTotalPages(status)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(status, (pagination[status] || 1) + 1)}
                    disabled={(pagination[status] || 1) === getTotalPages(status)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Order'}
              {actionType === 'reject' && 'Reject Order'}
              {actionType === 'start_production' && 'Start Production'}
              {actionType === 'complete' && 'Complete Order'}
              {actionType === 'assign_machine' && 'Assign Machine'}
              {actionType === 'counter_offer' && 'Counter Offer'}
              {actionType === 'accept_target_price' && 'Accept at Target Price'}
              {actionType === 'accept_counter_offer' && 'Accept Counter Offer'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'Approve this order and optionally assign a machine'}
              {actionType === 'reject' && 'Reject this order with a reason'}
              {actionType === 'start_production' && 'Start production for this order'}
              {actionType === 'complete' && 'Mark this order as completed'}
              {actionType === 'assign_machine' && 'Assign a machine to this order'}
              {actionType === 'counter_offer' && 'Enter the counter offer amount and any notes for the client.'}
              {actionType === 'accept_target_price' && 'Accept this order at the target price and move to awaiting payment.'}
              {actionType === 'accept_counter_offer' && 'Accept the counter offer and move to awaiting payment.'}
            </DialogDescription>
          </DialogHeader>
          {renderActionDialog()}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* {chatOrderId && (
        <OrderChatModal
          orderId={chatOrderId}
          isOpen={!!chatOrderId}
          onClose={() => setChatOrderId(null)}
          currentUser={currentUser}
        />
      )} */}

      <Dialog open={showProductionModal !== null} onOpenChange={() => setShowProductionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Production</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="machine_id">Assign Machine</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                value={productionMachineId ?? ""}
                onChange={e => setProductionMachineId(Number(e.target.value))}
              >
                <option value="" disabled>Select a machine</option>
                {machines.map(machine => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name} - {machine.supplier_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="production_date">Production Start Date</Label>
              <Input
                id="production_date"
                type="date"
                value={productionDate}
                onChange={e => setProductionDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowProductionModal(null)}>Cancel</Button>
              <Button onClick={() => handleConfirmProduction(orders.find(o => o.id === showProductionModal)!)}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderManagement;

