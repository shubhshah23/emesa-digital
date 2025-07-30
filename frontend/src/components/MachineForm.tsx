
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Machine {
  type: 'laser' | 'bending' | 'punch';
  make: string;
  capacity?: string; // Laser only
  bedSize?: string;  // Laser, Punch
  tonnage?: string;  // Bending, Punch
  bedLength?: string; // Bending only
}

interface MachineFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void; // Changed from Machine to FormData
  initialData?: Machine | null;
}

const availableMaterials = [
  "Aluminum", "Steel", "Stainless Steel", "Titanium", "Brass", "Copper", 
  "Carbon Steel", "Tool Steel", "Inconel", "ABS Plastic", "Delrin", "PEEK"
];

const availableCapabilities = [
  "3-axis milling", "4-axis milling", "5-axis milling", "High-speed machining",
  "Turning", "Threading", "Drilling", "Tapping", "Boring", "Grinding",
  "Surface finishing", "Precision work", "Heavy cutting"
];


const MachineForm = ({ isOpen, onClose, onSubmit, initialData }: MachineFormProps) => {
  const [formData, setFormData] = useState<Machine>({
    type: initialData?.type || "laser",
    make: initialData?.make || "",
    capacity: initialData?.capacity || "",
    bedSize: initialData?.bedSize || "",
    tonnage: initialData?.tonnage || "",
    bedLength: initialData?.bedLength || "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Update photo and preview when a new file is selected
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setPhoto(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    console.log("MachineForm handleSubmit called");
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        data.append(key, value as string);
      }
    });
    if (photo) {
      data.append('photo', photo);
    }
    console.log("Calling onSubmit with FormData", data);
    // @ts-ignore
    onSubmit(data); // onSubmit should handle FormData
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Machine" : "Add New Machine"}
          </DialogTitle>
          <DialogDescription>
            {initialData ? "Update machine details and specifications" : "Add a new CNC machine to your workshop"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
          <div className="space-y-2">
            <Label htmlFor="photo">Machine Photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Machine Preview"
                className="mt-2 max-h-40 rounded"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Machine Type</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="laser">Laser</SelectItem>
                <SelectItem value="bending">Bending</SelectItem>
                <SelectItem value="punch">Punch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Laser Fields */}
          {formData.type === "laser" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={e => setFormData(prev => ({ ...prev, make: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (W)</Label>
                <Input
                  id="capacity"
                  value={formData.capacity}
                  onChange={e => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedSize">Bed Size</Label>
                <Input
                  id="bedSize"
                  value={formData.bedSize}
                  onChange={e => setFormData(prev => ({ ...prev, bedSize: e.target.value }))}
                  required
                />
              </div>
            </>
          )}

          {/* Bending Fields */}
          {formData.type === "bending" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={e => setFormData(prev => ({ ...prev, make: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tonnage">Tonnage</Label>
                <Input
                  id="tonnage"
                  value={formData.tonnage}
                  onChange={e => setFormData(prev => ({ ...prev, tonnage: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedLength">Bed Length</Label>
                <Input
                  id="bedLength"
                  value={formData.bedLength}
                  onChange={e => setFormData(prev => ({ ...prev, bedLength: e.target.value }))}
                  required
                />
              </div>
            </>
          )}

          {/* Punch Fields */}
          {formData.type === "punch" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={e => setFormData(prev => ({ ...prev, make: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tonnage">Tonnage</Label>
                <Input
                  id="tonnage"
                  value={formData.tonnage}
                  onChange={e => setFormData(prev => ({ ...prev, tonnage: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedSize">Bed Size</Label>
                <Input
                  id="bedSize"
                  value={formData.bedSize}
                  onChange={e => setFormData(prev => ({ ...prev, bedSize: e.target.value }))}
                  required
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="submit">{initialData ? "Update Machine" : "Add Machine"}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MachineForm;
