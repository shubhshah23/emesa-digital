import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOrderMessages, sendOrderMessage, sendCounterOffer, acceptCounterOffer, confirmOrderPayment } from "../lib/api";

interface OrderChatModalProps {
  orderId: number;
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; email: string; role: string };
}

interface Message {
  id: number;
  sender: number;
  sender_email: string;
  sender_role: string;
  message: string;
  timestamp: string;
  is_admin: boolean;
  type?: string;
  amount?: number;
}

const OrderChatModal = ({ orderId, isOpen, onClose, currentUser }: OrderChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [sendingCounter, setSendingCounter] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      fetchOrderStatus();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, orderId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await getOrderMessages(orderId);
      setMessages(data);
    } catch (err) {
      // Optionally handle error
    }
    setLoading(false);
  };

  const fetchOrderStatus = async () => {
    // Optionally, you can pass order status as a prop for efficiency
    // Here, we fetch messages and infer status from the latest message or add an API call for order details
    // For now, let's just fetch messages and rely on parent to refresh order status after confirmation
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendOrderMessage(orderId, newMessage.trim());
      setNewMessage("");
      fetchMessages();
    } catch (err) {
      // Optionally handle error
    }
    setSending(false);
  };

  const handleSendCounterOffer = async () => {
    if (!counterAmount || isNaN(Number(counterAmount))) return;
    setSendingCounter(true);
    try {
      await sendCounterOffer(orderId, Number(counterAmount), newMessage.trim());
      setCounterAmount("");
      setNewMessage("");
      fetchMessages();
    } catch (err) {}
    setSendingCounter(false);
  };
  const handleAcceptCounter = async () => {
    setAccepting(true);
    try {
      await acceptCounterOffer(orderId);
      setAgreed(true);
      fetchMessages();
    } catch (err) {}
    setAccepting(false);
  };
  const handleConfirmPayment = async () => {
    setPaying(true);
    try {
      await confirmOrderPayment(orderId);
      fetchMessages();
      setOrderStatus('accepted');
    } catch (err) {}
    setPaying(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Order Chat</DialogTitle>
          <DialogDescription>
            Negotiate, clarify, and share quotations for this order. All messages are visible to both client and admin.
          </DialogDescription>
        </DialogHeader>
        <div className="h-80 overflow-y-auto bg-gray-50 rounded p-3 border mb-4">
          {loading ? (
            <div className="text-center text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg, idx) => {
              const isCounter = msg.type === 'counter_offer';
              const isSystem = msg.type === 'system';
              return (
                <div key={msg.id} className={`mb-3 flex ${msg.sender === Number(currentUser.id) ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-3 py-2 max-w-xs ${isSystem ? 'bg-gray-200 text-center w-full' : isCounter ? 'bg-yellow-100 border-yellow-400 border text-yellow-900' : (msg.sender === Number(currentUser.id) ? 'bg-green-100 text-right' : 'bg-white border')}`}
                    style={isSystem ? { fontStyle: 'italic', fontWeight: 500 } : {}}>
                    <div className="text-xs text-gray-500 mb-1">
                      {msg.sender_email} ({msg.sender_role})
                      {isCounter && msg.amount ? ` • Counter Offer: $${msg.amount}` : ''}
                    </div>
                    <div className="text-sm whitespace-pre-line">{msg.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleString()}</div>
                    {/* If this is the latest counter offer and client, show Accept/Counter */}
                    {isCounter && idx === messages.length - 1 && currentUser.role === 'client' && !agreed && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={handleAcceptCounter} disabled={accepting}>{accepting ? 'Accepting...' : 'Accept'}</Button>
                        <Button size="sm" variant="outline" onClick={() => setCounterAmount("")}>Counter</Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Counter offer input for admin/client */}
        {((currentUser.role === 'admin' || currentUser.role === 'client') && orderStatus !== 'accepted') && (
          <div className="flex gap-2 mt-2">
            <Input
              value={counterAmount}
              onChange={e => setCounterAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="Counter offer amount ($)"
              style={{ maxWidth: 140 }}
              disabled={sendingCounter}
            />
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Optional message..."
              disabled={sendingCounter}
            />
            <Button onClick={handleSendCounterOffer} disabled={sendingCounter || !counterAmount}>
              {sendingCounter ? 'Sending...' : 'Send Counter Offer'}
            </Button>
          </div>
        )}
        {/* Payment confirmation for client after agreement */}
        {currentUser.role === 'client' && orderStatus === 'awaiting_payment' && (
          <Button
            className="mt-2 w-full"
            variant="default"
            onClick={handleConfirmPayment}
            disabled={paying}
          >
            {paying ? 'Confirming...' : 'Confirm Payment'}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderChatModal; 