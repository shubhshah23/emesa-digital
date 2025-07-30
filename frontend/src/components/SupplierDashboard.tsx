
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, LogOut, Factory, Wrench, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MachineForm from "@/components/MachineForm";
import { getSuppliers, createSupplier, updateSupplier, getMachines, createMachine } from "../lib/api";

interface User {
  id: string;
  email: string;
  role: 'supplier' | 'admin';
}

interface Machine {
  id: string;
  name: string;
  type: 'laser' | 'bending' | 'punch';
  make: string;
  capacity?: string;
  bedSize?: string;
  tonnage?: string;
  bedLength?: string;
  status: 'available' | 'busy' | 'maintenance';
  addedAt: string;
  hourlyRate: number;
}

interface SupplierDashboardProps {
  user: User;
  onLogout: () => void;
}

const SupplierDashboard = ({ user, onLogout }: SupplierDashboardProps) => {
  const [machines, setMachines] = useState<Machine[]>([]);

  const [showMachineForm, setShowMachineForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const { toast } = useToast();

  const handleAddMachine = async (formData: FormData) => {
    console.log('formData instanceof FormData:', formData instanceof FormData);
    for (let pair of formData.entries()) {
      console.log(pair[0]+ ', ' + pair[1]);
    }
    try {
      await createMachine(formData);
      setShowMachineForm(false);
      toast({
        title: "Machine Added",
        description: `A new machine has been added to your workshop.`,
      });
      // Optionally, refresh the machine list here
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add machine. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditMachine = (machine: Machine) => {
    if (!editingMachine) return;
    
    setMachines(machines.map(m => 
      m.id === editingMachine.id 
        ? { ...machine, id: editingMachine.id, status: editingMachine.status, addedAt: editingMachine.addedAt }
        : m
    ));
    
    setEditingMachine(null);
    setShowMachineForm(false);
    
    toast({
      title: "Machine Updated",
      description: "Machine details have been updated successfully.",
    });
  };

  const handleStatusChange = (machineId: string, newStatus: Machine['status']) => {
    setMachines(machines.map(machine => 
      machine.id === machineId ? { ...machine, status: newStatus } : machine
    ));
    
    toast({
      title: "Status Updated",
      description: `Machine status changed to ${newStatus}.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const availableMachines = machines.filter(m => m.status === 'available');
  const busyMachines = machines.filter(m => m.status === 'busy');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-32">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Factory className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Supplier Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your CNC machines and workshop</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Supplier: {user.email}</span>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{machines.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{availableMachines.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Use</CardTitle>
              <Settings className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{busyMachines.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rate</CardTitle>
              <span className="text-sm text-muted-foreground">$/hr</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${machines.length > 0 ? Math.round(machines.reduce((sum, m) => sum + m.hourlyRate, 0) / machines.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>CNC Machines</CardTitle>
                <CardDescription>
                  Manage your workshop machines and their availability
                </CardDescription>
              </div>
              <Button onClick={() => setShowMachineForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Machine
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {machines.map((machine) => (
                <Card key={machine.id} className="border-l-4 border-l-blue-400">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{machine.name}</h3>
                          <Badge className={getStatusColor(machine.status)}>
                            {machine.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">Brand:</span> {machine.make}
                            </div>
                            <div>
                              <span className="font-medium">Type:</span> {machine.type}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Capacity:</span> {machine.capacity || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Bed Size:</span> {machine.bedSize || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Tonnage:</span> {machine.tonnage || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Bed Length:</span> {machine.bedLength || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Hourly Rate</div>
                          <div className="text-2xl font-bold text-blue-600">
                            ${machine.hourlyRate}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Button 
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setEditingMachine(machine);
                              setShowMachineForm(true);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Machine
                          </Button>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              variant={machine.status === 'available' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange(machine.id, 'available')}
                            >
                              Available
                            </Button>
                            <Button 
                              size="sm"
                              variant={machine.status === 'maintenance' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange(machine.id, 'maintenance')}
                            >
                              Maintenance
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {showMachineForm && (
        <MachineForm
          isOpen={showMachineForm}
          onClose={() => {
            setShowMachineForm(false);
            setEditingMachine(null);
          }}
          onSubmit={handleAddMachine}
          initialData={editingMachine as any}
        />
      )}
    </div>
  );
};

export default SupplierDashboard;
