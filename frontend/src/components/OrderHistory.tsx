import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, CheckCircle, Play, Package, XCircle, FileText, DollarSign, Calendar, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getOrders, acceptCounterOffer, confirmOrderPayment, rejectOrder, sendCounterOffer, getOrderMessages } from "../lib/api";
import OrderChatModal from "./OrderChatModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Order {
  id: number;
  client_name: string;
  client_company: string;
  product_description: string;
  quantity: number;
  material_type: string;
  material_grade: string;
  material_thickness: string;
  surface_treatment: string;
  packing_standard: string;
  status: string;
  date_submitted: string;
  expected_completion_date?: string;
  machine_name?: string;
  supplier_name?: string;
  price_estimate?: number;
  actual_cost?: number;
  admin_notes?: string;
  rejection_reason?: string;
  step_file: string;
  date_accepted?: string;
  date_production_started?: string;
  date_completed?: string;
  date_rejected?: string;
  target_price?: number;
  step_file_url?: string;
  d2_draft_design_url?: string;
  payment_confirmed?: boolean;
  part_id?: string;
  agreed_price?: number;
}

interface OrderHistoryProps {
  user: any;
  onBack: () => void;
}

const OrderHistory = ({ user, onBack }: OrderHistoryProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [chatOrderId, setChatOrderId] = useState<number | null>(null);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState<number | null>(null);
  const [clientCounterOffer, setClientCounterOffer] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState<number | null>(null);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '' });
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [latestCounterOffers, setLatestCounterOffers] = useState<{ [orderId: number]: { amount: number, sender: string, sender_role:string, admin_notes?: string } | null }>({});
  const [expandedOrders, setExpandedOrders] = useState<{ [orderId: number]: boolean }>({});
  const ORDERS_PER_PAGE = 5;
  const [pagination, setPagination] = useState<{ [tab: string]: number }>({});

  useEffect(() => {
    loadOrders();
    pollingRef.current = setInterval(() => {
      loadOrders();
    }, 1000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Fetch latest counter offer for each order in negotiation
  useEffect(() => {
    const fetchCounterOffers = async () => {
      const offers: { [orderId: number]: { amount: number, sender: string, sender_role: string, admin_notes?: string } | null } = {};
      for (const order of orders) {
        if (["negotiation", "quotation_sent", "awaiting_payment"].includes(order.status)) {
          const messages = await getOrderMessages(order.id);
          const lastOffer = messages.filter((m: any) => m.type === 'counter_offer').sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          offers[order.id] = lastOffer
            ? {
                amount: lastOffer.amount,
                sender: lastOffer.sender || '',
                sender_role: lastOffer.sender_role || 'client',
                admin_notes: lastOffer.admin_notes || ''
              }
            : null;
        }
      }
      setLatestCounterOffers(offers);
    };
    fetchCounterOffers();
  }, [orders]);

  const loadOrders = async () => {
    try {
      const ordersData = await getOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load order history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    return 'bg-gray-100 text-black';
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'under_review':
        return 'Your order is being reviewed by our engineering team. We will respond within 24-48 hours.';
      case 'accepted':
        return 'Your order has been approved and is ready for production.';
      case 'in_production':
        return 'Your order is currently being manufactured.';
      case 'completed':
        return 'Your order has been completed and is ready for delivery.';
      case 'rejected':
        return 'Your order has been rejected. Please check the rejection reason below.';
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

  const filterOrdersByStatus = (status: string) => {
    if (status === 'under_review') {
      return orders.filter(order => order.status === 'under_review' || order.status === 'negotiation' || order.status === 'quotation_sent');
    }
    return orders.filter(order => order.status === status);
  };

  const handleAcceptCounterOffer = async (orderId: number) => {
    try {
      await acceptCounterOffer(orderId);
      toast({ title: "Counter Offer Accepted", description: "Order is now awaiting payment." });
      loadOrders();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.error || "An error occurred", variant: "destructive" });
    }
  };

  const handlePayNow = (orderId: number) => {
    setShowPaymentModal(orderId);
  };

  const handlePaymentSubmit = async (orderId: number) => {
    try {
      await confirmOrderPayment(orderId);
      toast({ title: "Payment Confirmed", description: "Your payment has been confirmed." });
      setShowPaymentModal(null);
      loadOrders();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.error || "An error occurred", variant: "destructive" });
    }
  };

  const handleClientCounterOffer = async (orderId: number) => {
    try {
      await sendCounterOffer(orderId, parseFloat(clientCounterOffer));
      toast({ title: "Counter Offer Sent", description: "Your counter offer has been sent to the admin." });
      setShowCounterOfferModal(null);
      setClientCounterOffer("");
      loadOrders();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.error || "An error occurred", variant: "destructive" });
    }
  };

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handlePageChange = (tab: string, page: number) => {
    setPagination(prev => ({ ...prev, [tab]: page }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-semibold text-[rgb(38,38,38)] mb-1">My orders</h2>
            <div className="text-xs text-[rgb(112,115,122)]">
              <span className="font-semibold text-black">Note:</span> Final order details will be reflected in the invoice copy
            </div>
          </div>
          <Button 
            className="bg-[#2046b3] hover:bg-[#183488] text-white font-medium rounded-lg px-6 py-2 text-[15px]" 
            onClick={onBack}>
            Submit Requirements
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Looks like you have not placed any order yet
              </div>
              <Button onClick={onBack} className="bg-black hover:bg-gray-900 text-white font-semibold px-8 py-3 rounded-lg text-base transition mb-10">
                Browse products
              </Button>
              <hr className="w-full border-gray-200 my-8" />
              <div className="text-center">
                <div className="font-medium text-gray-900 mb-1">
                  Question related to your orders? <span className="font-semibold">Connect with us</span>
                </div>
                <div className="text-sm text-gray-500">
                  Our support team is available for your question regarding your material requirement, pricing, shipping and billing related queries
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="flex border-b border-gray-200 bg-transparent rounded-none mb-8 px-0 font-sans">
              {['all', 'under_review', 'accepted', 'in_production', 'completed', 'rejected'].map((status) => (
                <TabsTrigger
                  key={status}
                  value={status}
                  className={
                    `px-4 py-2 text-[15px] font-normal bg-transparent outline-none border-0 rounded-none transition font-sans ` +
                    `data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-black ` +
                    `text-[rgb(112,115,122)] hover:text-black`
                  }
                >
                  {status === 'all' && `All Orders (${orders.length})`}
                  {status === 'under_review' && (<><Clock className="h-4 w-4 mr-2 inline text-[rgb(112,115,122)]" />Under Review ({filterOrdersByStatus('under_review').length})</>)}
                  {status === 'accepted' && (<><CheckCircle className="h-4 w-4 mr-2 inline text-[rgb(112,115,122)]" />Accepted ({filterOrdersByStatus('accepted').length})</>)}
                  {status === 'in_production' && (<><Play className="h-4 w-4 mr-2 inline text-[rgb(112,115,122)]" />In Production ({filterOrdersByStatus('in_production').length})</>)}
                  {status === 'completed' && (<><Package className="h-4 w-4 mr-2 inline text-[rgb(112,115,122)]" />Completed ({filterOrdersByStatus('completed').length})</>)}
                  {status === 'rejected' && (<><XCircle className="h-4 w-4 mr-2 inline text-[rgb(112,115,122)]" />Rejected ({filterOrdersByStatus('rejected').length})</>)}
                </TabsTrigger>
              ))}
            </TabsList>

            {['all', 'under_review', 'accepted', 'in_production', 'completed', 'rejected'].map((status) => {
              const tabKey = status;
              const allOrders = status === 'all' ? orders : filterOrdersByStatus(status);
              const currentPage = pagination[tabKey] || 1;
              const totalPages = Math.ceil(allOrders.length / ORDERS_PER_PAGE) || 1;
              const paginatedOrders = allOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);
              
              return (
                <TabsContent key={status} value={status}>
                  <div className="grid gap-6">
                    {paginatedOrders.map((order) => {
                      const isExpanded = expandedOrders[order.id] || false;
                      
                      return (
                        <Card key={order.id} className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="flex items-center gap-3 text-gray-900 text-lg font-semibold">
                                  Order #{order.id}
                                  <div className={getStatusColor(order.status) + ' font-medium border-none px-3 py-1 inline-flex items-center gap-1 rounded text-xs min-w-[120px] justify-center text-black bg-gray-100'}>
                                    {getStatusIcon(order.status)}
                                    {order.status.replace('_', ' ').toUpperCase()}
                                  </div>
                                </CardTitle>
                                <div className="text-xs text-gray-400 mt-1">Part ID: <span className="font-mono">{order.part_id && order.part_id !== 'NULL' ? order.part_id : '—'}</span></div>
                                <CardDescription className="mt-2">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1 text-gray-500">
                                      <Calendar className="h-4 w-4" />
                                      Submitted: {formatDate(order.date_submitted)}
                                    </span>
                                    {order.expected_completion_date && (
                                      <span className="flex items-center gap-1 text-gray-500">
                                        <Clock className="h-4 w-4" />
                                        Expected: {formatDate(order.expected_completion_date)}
                                      </span>
                                    )}
                                  </div>
                                </CardDescription>
                              </div>
                              {order.price_estimate && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Price Estimate</p>
                                  <p className="text-lg font-semibold text-black">₹{order.price_estimate}</p>
                                </div>
                              )}
                              <button
                                className={`ml-4 mt-2 p-1 rounded-full transition-transform bg-transparent ${isExpanded ? 'rotate-180' : ''}`}
                                aria-label={isExpanded ? 'Hide Details' : 'Show Details'}
                                onClick={() => toggleOrderExpand(order.id)}
                                style={{ alignSelf: 'center' }}
                              >
                                <ChevronDown className="h-6 w-6 text-black" />
                              </button>
                            </div>
                          </CardHeader>

                          {isExpanded && (
                            <>
                              <CardContent>
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
                                      <p><span className="font-medium">Part ID:</span> <span className="font-mono">{order.part_id && order.part_id !== 'NULL' ? order.part_id : '—'}</span></p>
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
                                <div className="mt-6 flex gap-2">
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
                                </div>
                              </CardContent>
                            </>
                          )}

                          {showPaymentModal === order.id && (
                            <Dialog open={true} onOpenChange={() => setShowPaymentModal(null)}>
                              <DialogContent className="max-w-2xl w-full p-0 overflow-hidden min-h-[500px]">
                                <div className="flex flex-col md:flex-row w-full">
                                  {/* Left: Order/payment summary */}
                                  <div className="md:w-1/2 w-full bg-gray-50 p-10 flex flex-col justify-between border-r border-gray-200 min-h-[500px]">
                                    <div>
                                      <div className="flex items-center gap-2 mb-6">
                                        <Lock className="h-5 w-5 text-green-600" />
                                        <span className="font-semibold text-xl text-gray-900">Secure Payment</span>
                                      </div>
                                      <div className="mb-4 text-gray-700 font-medium text-lg">Order #{order.id}</div>
                                      <div className="mb-4 text-gray-500 text-base">{order.product_description}</div>
                                      <div className="mb-8 space-y-2">
                                        <div className="flex justify-between text-base">
                                          <span>Quantity:</span>
                                          <span>{order.quantity}</span>
                                        </div>
                                        <div className="flex justify-between text-base">
                                          <span>Material:</span>
                                          <span>{order.material_type} - {order.material_grade}</span>
                                        </div>
                                        <div className="flex justify-between text-base">
                                          <span>Total Price:</span>
                                          <span>₹{order.agreed_price || order.price_estimate || order.target_price}</span>
                                        </div>
                                      </div>
                                      <div className="border-t border-gray-200 pt-6 mt-6">
                                        <div className="flex justify-between font-semibold text-lg mb-2">
                                          <span>Total Cost</span>
                                          <span>₹{order.agreed_price || order.price_estimate || order.target_price}</span>
                                        </div>
                                        {order.expected_completion_date && (
                                          <div className="flex justify-between text-base mt-4">
                                            <span>Expected Completion:</span>
                                            <span>{formatDate(order.expected_completion_date)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {/* Right: Card details form */}
                                  <div className="md:w-1/2 w-full bg-white p-10 flex flex-col justify-center min-h-[500px]">
                                    <form onSubmit={(e) => {
                                      e.preventDefault();
                                      handlePaymentSubmit(order.id);
                                    }} className="space-y-8">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                                        <input
                                          type="text"
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          value={cardDetails.number}
                                          onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })}
                                          placeholder="1234 5678 9012 3456"
                                          required
                                        />
                                      </div>
                                      <div className="flex gap-4">
                                        <div className="w-1/2">
                                          <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                                          <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={cardDetails.expiry}
                                            onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                            placeholder="MM/YY"
                                            required
                                          />
                                        </div>
                                        <div className="w-1/2">
                                          <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                                          <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={cardDetails.cvc}
                                            onChange={e => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                                            placeholder="123"
                                            required
                                          />
                                        </div>
                                      </div>
                                      <Button type="submit" className="w-full bg-black text-white py-2 rounded-md font-semibold mt-6">Pay Now</Button>
                                    </form>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {/* Counter offer box always at the very bottom of the card, after everything else */}
                          {['negotiation', 'quotation_sent', 'awaiting_payment'].includes(order.status) && latestCounterOffers[order.id] && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-md">
                              <div className="font-medium text-yellow-800">
                                Latest Counter Offer: ₹{
                                  typeof latestCounterOffers[order.id]?.amount === 'number'
                                    ? latestCounterOffers[order.id]?.amount.toFixed(2)
                                    : latestCounterOffers[order.id]?.amount ?? ''
                                } (from {
                                  (() => {
                                    const senderRole = latestCounterOffers[order.id]?.sender_role;
                                    const sender = latestCounterOffers[order.id]?.sender;
                                    if (user?.role === 'client') {
                                      if (senderRole === 'admin') return 'Admin';
                                      return 'You';
                                    }
                                    if (user?.role === 'admin') {
                                      if (senderRole === 'client') {
                                        if (typeof sender === 'string' && sender.includes('@')) return sender;
                                        return order.client_name || sender || 'Client';
                                      }
                                      return 'You';
                                    }
                                    return typeof sender === 'string' ? sender : 'Unknown';
                                  })()
                                })
                              </div>
                              {latestCounterOffers[order.id]?.admin_notes && (
                                <div className="text-sm text-yellow-700 mt-1">Note: {latestCounterOffers[order.id]?.admin_notes}</div>
                              )}
                              {/* Show client actions if latest is from admin and user is client */}
                              {user?.role === 'client' && latestCounterOffers[order.id]?.sender_role === 'admin' && !['completed','rejected','accepted','in_production'].includes(order.status) && (
                                <>
                                  {/* Show action buttons only if counter offer hasn't been accepted yet */}
                                  {!order.agreed_price && (
                                    <div className="flex gap-2 mt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-gray-300 text-gray-700 hover:bg-gray-200"
                                        onClick={() => handleAcceptCounterOffer(order.id)}
                                      >
                                        Accept Counter Offer
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        className="border-gray-300"
                                        onClick={() => setShowCounterOfferModal(order.id)}
                                      >
                                        Counter Offer
                                      </Button>
                                      {showCounterOfferModal === order.id && (
                                        <Dialog open={true} onOpenChange={() => setShowCounterOfferModal(null)}>
                                          <DialogContent className="max-w-md w-full p-6">
                                            <DialogHeader>
                                              <DialogTitle>Submit Counter Offer</DialogTitle>
                                            </DialogHeader>
                                            <form onSubmit={e => {
                                              e.preventDefault();
                                              handleClientCounterOffer(order.id);
                                            }} className="space-y-6">
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Your Counter Offer Price (₹)</label>
                                                <input
                                                  type="number"
                                                  min="1"
                                                  step="0.01"
                                                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                  value={clientCounterOffer}
                                                  onChange={e => setClientCounterOffer(e.target.value)}
                                                  placeholder="Enter your price"
                                                  required
                                                />
                                              </div>
                                              <div className="flex gap-2 justify-end">
                                                <Button variant="outline" type="button" onClick={() => setShowCounterOfferModal(null)}>Cancel</Button>
                                                <Button type="submit" className="bg-black text-white">Send Counter Offer</Button>
                                              </div>
                                            </form>
                                          </DialogContent>
                                        </Dialog>
                                      )}
                                    </div>
                                  )}
                                  {/* Show accepted ribbon if counter offer has been accepted */}
                                  {order.agreed_price && (
                                    <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-md">
                                      <div className="font-medium text-green-800 text-sm">
                                        Counter Offer Accepted: Agreed Price ₹{order.agreed_price}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                          {/* Payment ribbon for awaiting payment orders */}
                          {user?.role === 'client' && order.status === 'awaiting_payment' && !order.payment_confirmed && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => handlePayNow(order.id)}>
                              <div className="font-medium text-blue-800 flex justify-between items-center">
                                <span>Agreed Price: ₹{order.agreed_price || order.price_estimate || order.target_price}</span>
                                <span className="text-sm">Pay Now →</span>
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(status, currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(status, currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </main>
      
      {chatOrderId && (
        <OrderChatModal
          orderId={chatOrderId}
          isOpen={!!chatOrderId}
          onClose={() => setChatOrderId(null)}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default OrderHistory;
