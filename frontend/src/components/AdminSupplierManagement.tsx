
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Factory, Search, Wrench, MapPin, DollarSign, Plus, Edit } from "lucide-react";
import { getSuppliers, createSupplier, updateSupplier, getMachines, createMachine } from "../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const MACHINE_TYPE_CHOICES = [
  { value: "laser", label: "Laser" },
  { value: "bending", label: "Bending" },
  { value: "punch", label: "Punch" },
];

const AdminSupplierManagement = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  // Modal state
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [supplierForm, setSupplierForm] = useState({ name: "", email: "", contact_info: "", phone: "", address: "" });
  const [savingSupplier, setSavingSupplier] = useState(false);
  // Remove expand/collapse state and logic
  // Remove: const [expandedSupplierIds, setExpandedSupplierIds] = useState<number[]>([]);
  // Remove: handleExpandSupplier and all uses
  // Always show machine list for each supplier
  const [machinesBySupplier, setMachinesBySupplier] = useState<{ [supplierId: number]: any[] }>({});
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [machineForm, setMachineForm] = useState({
    name: "",
    type: "laser",
    make: "",
    capacity: "",
    bedSize: "",
    tonnage: "",
    bedLength: "",
  });
  const [machineSupplierId, setMachineSupplierId] = useState<number | null>(null);
  const [savingMachine, setSavingMachine] = useState(false);
  const [showMachinesPanel, setShowMachinesPanel] = useState(false);
  const [activeSupplier, setActiveSupplier] = useState<any | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (editingSupplier) {
      setSupplierForm({
        name: editingSupplier.name || "",
        email: editingSupplier.email || "",
        contact_info: editingSupplier.contact_info || "",
        phone: editingSupplier.phone || "",
        address: editingSupplier.address || ""
      });
    } else {
      setSupplierForm({ name: "", email: "", contact_info: "", phone: "", address: "" });
    }
  }, [showSupplierModal, editingSupplier]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
      // Fetch machines for all suppliers
      const allMachines = await getMachines();
      const machinesBySupplierObj: { [supplierId: number]: any[] } = {};
      data.forEach((supplier: any) => {
        machinesBySupplierObj[supplier.id] = allMachines.filter((m: any) => m.supplier === supplier.id);
      });
      setMachinesBySupplier(machinesBySupplierObj);
    } catch (err) {
      // Optionally handle error
    }
    setLoading(false);
  };

  const handleSupplierFormChange = (e: any) => {
    setSupplierForm({ ...supplierForm, [e.target.name]: e.target.value });
  };

  const handleSaveSupplier = async () => {
    setSavingSupplier(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, supplierForm);
      } else {
        await createSupplier(supplierForm);
      }
      setShowSupplierModal(false);
      fetchSuppliers();
    } catch (err) {
      // Optionally handle error
    }
    setSavingSupplier(false);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchMachinesForSupplier = async (supplierId: number) => {
    try {
      const allMachines = await getMachines();
      const supplierMachines = allMachines.filter((m: any) => m.supplier === supplierId);
      setMachinesBySupplier(prev => ({ ...prev, [supplierId]: supplierMachines }));
    } catch (err) {
      // Optionally handle error
    }
  };

  const handleShowAddMachine = (supplierId: number) => {
    setMachineSupplierId(supplierId);
    setMachineForm({
      name: "",
      type: "laser",
      make: "",
      capacity: "",
      bedSize: "",
      tonnage: "",
      bedLength: "",
    });
    setShowMachineModal(true);
  };

  const handleMachineFormChange = (e: any) => {
    const { name, value } = e.target;
    setMachineForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveMachine = async () => {
    if (!machineSupplierId) return;
    setSavingMachine(true);
    try {
      const formData = new FormData();
      Object.entries(machineForm).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (
            key === "photo" &&
            typeof value === "object" &&
            value !== null &&
            (value as any) instanceof File
          ) {
            formData.append(key, value);
          } else {
            formData.append(key, value as string);
          }
        }
      });
      formData.append("supplier", machineSupplierId.toString());
      await createMachine(formData);
      setShowMachineModal(false);
      fetchSuppliers(); // re-fetch all suppliers and their machines
    } catch (err) {
      // Optionally handle error
    }
    setSavingMachine(false);
  };

  // Enterprise color palette
  const PRIMARY_GREEN = '#76B900';
  const NAVY_BLUE = '#1F2A44';
  const COOL_GREY = '#DDE2E8';
  const SNOW_WHITE = '#FAFAFA';
  const SLATE_BLUE = '#3E5060';

  return (
    <div className="space-y-6" style={{ background: SNOW_WHITE, minHeight: '100vh', paddingBottom: 32 }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold" style={{ color: NAVY_BLUE }}>Suppliers</h2>
        <button
          style={{ backgroundColor: PRIMARY_GREEN }}
          className="text-white px-4 py-2 rounded flex items-center gap-2 shadow hover:brightness-90"
          onClick={() => { setEditingSupplier(null); setShowSupplierModal(true); }}
        >
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>
      <Input
        placeholder="Search suppliers..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="mb-4 max-w-md"
        style={{ backgroundColor: SNOW_WHITE, color: SLATE_BLUE, borderColor: COOL_GREY }}
      />
      {loading ? (
        <div className="text-center text-gray-500">Loading suppliers...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredSuppliers.map(supplier => (
            <Card key={supplier.id} className="border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow p-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{supplier.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-500">{supplier.email || supplier.contact_info}</CardDescription>
                  <div className="text-xs text-gray-400">{supplier.address}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    className="flex items-center gap-1 px-3 py-1 text-white rounded-full shadow transition-colors bg-green-600 hover:bg-green-700"
                    onClick={() => handleShowAddMachine(supplier.id)}
                  >
                    <Plus className="h-4 w-4" /> Add Machine
                  </button>
                  <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200" onClick={() => { setEditingSupplier(supplier); setShowSupplierModal(true); }}><Edit className="h-4 w-4 text-gray-700" /></button>

                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mt-2">
                  <div className="font-semibold text-gray-800 mb-2">Machines:</div>
                  <div className="flex flex-wrap gap-4">
                    {(machinesBySupplier[supplier.id] || []).map(machine => (
                      <div key={machine.id} className="w-60 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-0 flex flex-col items-stretch">
                        {/* Photo placeholder or image */}
                        <div className="w-full h-36 bg-gray-100 flex items-center justify-center rounded-t-xl overflow-hidden">
                          {machine.photo_url ? (
                            <img src={machine.photo_url} alt={machine.name} className="object-cover w-full h-full" />
                          ) : (
                            <span className="text-gray-300 text-4xl">+</span>
                          )}
                        </div>
                        <div className="p-4 flex flex-col items-start">
                          <div className="w-full flex items-center gap-2 mb-2">
                            <span className="font-bold text-gray-900 text-base font-manrope">{machine.name}</span>
                            <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold uppercase font-manrope">{MACHINE_TYPE_CHOICES.find(t => t.value === machine.type)?.label || machine.type}</span>
                          </div>
                          {machine.make && <div className="text-base text-gray-700 mb-1 font-manrope">Make: {machine.make}</div>}
                          {machine.capacity && <div className="text-base text-gray-700 mb-1 font-manrope">Capacity: {machine.capacity}</div>}
                          {machine.bedSize && <div className="text-xs text-gray-500 mb-1">Bed Size: {machine.bedSize}</div>}
                          {machine.tonnage && <div className="text-xs text-gray-500 mb-1">Tonnage: {machine.tonnage}</div>}
                          {machine.bedLength && <div className="text-xs text-gray-500 mb-1">Bed Length: {machine.bedLength}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Supplier create/edit modal and delete confirmation modal will go here */}
      <Dialog open={showSupplierModal} onOpenChange={setShowSupplierModal}>
        <DialogContent style={{ background: SNOW_WHITE }}>
          <DialogHeader>
            <DialogTitle style={{ color: NAVY_BLUE }}>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSaveSupplier(); }}>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Name</label>
              <Input name="name" value={supplierForm.name} onChange={handleSupplierFormChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Email</label>
              <Input name="email" value={supplierForm.email} onChange={handleSupplierFormChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Contact Info</label>
              <Input name="contact_info" value={supplierForm.contact_info} onChange={handleSupplierFormChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Phone</label>
              <Input name="phone" value={supplierForm.phone} onChange={handleSupplierFormChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Address</label>
              <Input name="address" value={supplierForm.address} onChange={handleSupplierFormChange} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="px-4 py-2" style={{ background: COOL_GREY, color: NAVY_BLUE, borderRadius: 6 }} onClick={() => setShowSupplierModal(false)}>Cancel</button>
              <button type="submit" style={{ backgroundColor: PRIMARY_GREEN }} className="px-4 py-2 text-white rounded" disabled={savingSupplier}>
                {savingSupplier ? "Saving..." : (editingSupplier ? "Save Changes" : "Add Supplier")}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Add Machine Modal (unchanged) */}
      <Dialog open={showMachineModal} onOpenChange={setShowMachineModal}>
        <DialogContent style={{ background: SNOW_WHITE }}>
          <DialogHeader>
            <DialogTitle style={{ color: NAVY_BLUE }}>Add Machine</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSaveMachine(); }}>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Name</label>
              <Input name="name" value={machineForm.name} onChange={handleMachineFormChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Type</label>
              <select name="type" value={machineForm.type} onChange={handleMachineFormChange} className="w-full border rounded px-2 py-1">
                {MACHINE_TYPE_CHOICES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* Laser Fields */}
            {machineForm.type === "laser" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Make</label>
                  <Input name="make" value={machineForm.make || ""} onChange={handleMachineFormChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Capacity (W)</label>
                  <Input name="capacity" value={machineForm.capacity || ""} onChange={handleMachineFormChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Bed Size</label>
                  <Input name="bedSize" value={machineForm.bedSize || ""} onChange={handleMachineFormChange} required />
                </div>
              </>
            )}
            {/* Bending Fields */}
            {machineForm.type === "bending" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Make</label>
                  <Input name="make" value={machineForm.make || ""} onChange={handleMachineFormChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Tonnage</label>
                  <Input name="tonnage" value={machineForm.tonnage || ""} onChange={handleMachineFormChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Bed Length</label>
                  <Input name="bedLength" value={machineForm.bedLength || ""} onChange={handleMachineFormChange} required />
                </div>
              </>
            )}
            {/* Punch Fields */}
            {machineForm.type === "punch" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Make</label>
                  <Input name="make" value={machineForm.make || ""} onChange={handleMachineFormChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Tonnage</label>
                  <Input name="tonnage" value={machineForm.tonnage || ""} onChange={handleMachineFormChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Bed Size</label>
                  <Input name="bedSize" value={machineForm.bedSize || ""} onChange={handleMachineFormChange} required />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: SLATE_BLUE }}>Photo (optional)</label>
              <input type="file" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  setMachineForm(prev => ({ ...prev, photo: file }));
                }
              }} />
              {machineForm.photo && (
                <div className="mt-2">
                  <img src={URL.createObjectURL(machineForm.photo)} alt="Preview" className="h-24 w-36 object-cover rounded" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="px-4 py-2" style={{ background: COOL_GREY, color: NAVY_BLUE, borderRadius: 6 }} onClick={() => setShowMachineModal(false)}>Cancel</button>
              <button type="submit" style={{ backgroundColor: PRIMARY_GREEN }} className="px-4 py-2 text-white rounded" disabled={savingMachine}>
                {savingMachine ? "Saving..." : "Add Machine"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupplierManagement;
