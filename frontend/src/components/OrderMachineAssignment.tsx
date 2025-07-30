
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Package, Wrench, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Order {
  id: string;
  clientEmail: string;
  productDescription: string;
  quantity: string;
  material: string;
  status: 'pending' | 'in_production' | 'completed' | 'rejected';
  estimatedPrice: number;
  assignedMachine?: string;
  assignedSupplier?: string;
}

interface Machine {
  id: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  materials: string[];
  status: 'available' | 'busy' | 'maintenance';
  hourlyRate: number;
  supplierId: string;
  supplierName: string;
}

interface OrderMachineAssignmentProps {
  orders: Order[];
  onAssignMachine: (orderId: string, machineId: string, supplierId: string) => void;
}

const OrderMachineAssignment = ({ orders, onAssignMachine }: OrderMachineAssignmentProps) => {
  const [machines] = useState<Machine[]>([
    {
      id: "MAC-001",
      name: "Haas VF-2SS",
      type: "milling",
      brand: "Haas",
      model: "VF-2SS",
      materials: ["Aluminum", "Steel", "Stainless Steel"],
      status: "available",
      hourlyRate: 85,
      supplierId: "SUP-001",
      supplierName: "Precision CNC Works"
    },
    {
      id: "MAC-002",
      name: "DMG MORI CTX",
      type: "turning",
      brand: "DMG MORI",
      model: "CTX 310",
      materials: ["Steel", "Stainless Steel", "Titanium"],
      status: "busy",
      hourlyRate: 95,
      supplierId: "SUP-001",
      supplierName: "Precision CNC Works"
    },
    {
      id: "MAC-003",
      name: "Mazak Integrex",
      type: "milling",
      brand: "Mazak",
      model: "Integrex i-300S",
      materials: ["Aluminum", "Steel", "Brass", "Titanium"],
      status: "available",
      hourlyRate: 105,
      supplierId: "SUP-002",
      supplierName: "Advanced Manufacturing Co"
    }
  ]);

  const { toast } = useToast();

  const getCompatibleMachines = (order: Order) => {
    return machines.filter(machine => 
      machine.materials.includes(order.material) && 
      machine.status === 'available'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_production': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMachineStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAssignment = (orderId: string, machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    if (machine) {
      onAssignMachine(orderId, machineId, machine.supplierId);
      toast({
        title: "Machine Assigned",
        description: `Order ${orderId} has been assigned to ${machine.name} at ${machine.supplierName}.`,
      });
    }
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const inProductionOrders = orders.filter(order => order.status === 'in_production');

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignment</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Production</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProductionOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Machines</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {machines.filter(m => m.status === 'available').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{machines.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order-Machine Assignment</CardTitle>
          <CardDescription>
            Assign orders to compatible CNC machines from your supplier network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {pendingOrders.map((order) => {
              const compatibleMachines = getCompatibleMachines(order);
              
              return (
                <Card key={order.id} className="border-l-4 border-l-yellow-400">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{order.id}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Order Value</div>
                          <div className="text-xl font-bold text-blue-600">
                            ${order.estimatedPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div><span className="font-medium">Client:</span> {order.clientEmail}</div>
                          <div><span className="font-medium">Description:</span> {order.productDescription}</div>
                          <div><span className="font-medium">Quantity:</span> {order.quantity}</div>
                          <div><span className="font-medium">Material:</span> {order.material}</div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Compatible Machines:</span>
                            {compatibleMachines.length === 0 && (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                No Compatible Machines
                              </Badge>
                            )}
                          </div>
                          
                          {compatibleMachines.length > 0 && (
                            <Select onValueChange={(machineId) => handleAssignment(order.id, machineId)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select machine to assign..." />
                              </SelectTrigger>
                              <SelectContent>
                                {compatibleMachines.map((machine) => (
                                  <SelectItem key={machine.id} value={machine.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <div>
                                        <div className="font-medium">{machine.name}</div>
                                        <div className="text-sm text-gray-600">
                                          {machine.supplierName} • ${machine.hourlyRate}/hr
                                        </div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>

                      {compatibleMachines.length > 0 && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Available Machines for {order.material}:</h4>
                            <div className="grid gap-2">
                              {compatibleMachines.map((machine) => (
                                <div key={machine.id} className="bg-gray-50 rounded p-3 flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">{machine.name}</span>
                                      <Badge className={getMachineStatusColor(machine.status)}>
                                        {machine.status}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {machine.brand} {machine.model} • {machine.supplierName}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">${machine.hourlyRate}/hr</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {pendingOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No pending orders requiring machine assignment</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {inProductionOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Currently in Production</CardTitle>
            <CardDescription>
              Orders that have been assigned to machines and are being processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inProductionOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-blue-400">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{order.id}</h4>
                        <p className="text-sm text-gray-600">{order.productDescription}</p>
                        {order.assignedMachine && (
                          <p className="text-sm text-blue-600 mt-1">
                            Assigned to: {machines.find(m => m.id === order.assignedMachine)?.name} 
                            ({machines.find(m => m.id === order.assignedMachine)?.supplierName})
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        In Production
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderMachineAssignment;
