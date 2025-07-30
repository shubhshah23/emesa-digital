
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PriceNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  currentPrice: number;
  targetPrice?: string;
  onSubmit: (orderId: string, counterOffer: number, notes: string) => void;
}

const PriceNegotiationModal = ({ 
  isOpen, 
  onClose, 
  orderId, 
  currentPrice, 
  targetPrice, 
  onSubmit 
}: PriceNegotiationModalProps) => {
  const [counterOffer, setCounterOffer] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!counterOffer || parseFloat(counterOffer) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid counter offer price.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(orderId, parseFloat(counterOffer), notes);
    setCounterOffer("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Negotiate Price - {orderId}</DialogTitle>
          <DialogDescription>
            Send a counter offer to the client for this order.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Current Estimate:</span>
                <span className="text-lg font-semibold">₹{currentPrice.toLocaleString()}</span>
              </div>
              {targetPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Client Target:</span>
                  <span className="text-sm text-blue-600">₹{targetPrice}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="counter-offer">Counter Offer (₹)</Label>
              <Input
                id="counter-offer"
                type="number"
                placeholder="Enter your counter offer"
                value={counterOffer}
                onChange={(e) => setCounterOffer(e.target.value)}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Explain the pricing rationale, possible alternatives, or other considerations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              <DollarSign className="h-4 w-4 mr-2" />
              Send Counter Offer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PriceNegotiationModal;
