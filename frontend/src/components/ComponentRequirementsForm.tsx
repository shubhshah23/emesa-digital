
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileCheck, CreditCard, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createOrder } from "../lib/api";

interface User {
  id: string;
  email: string;
  role: 'client' | 'admin';
}

interface ComponentRequirementsFormProps {
  user: User;
  onNavigateToHistory?: () => void;
}

const ComponentRequirementsForm = ({ user, onNavigateToHistory }: ComponentRequirementsFormProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    partId: "",
    d2DraftDesign: null as File | null,
    productDescription: "",
    quantity: "",
    material: "",
    materialThickness: "",
    materialGrade: "",
    surfaceTreatment: "",
    packingStandard: "",
    targetPrice: "",
    tolerances: "",
    additionalRequirements: "",
    stepFile: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const materialOptions = [
    "HR SHEET IS 1079 D",
    "HR SHEET IS 2062 E250",
    "HR SHEET IS 2062 E350",
    "CR SHEET IS 513",
    "GI SHEET IS 277-275 GSM",
    "GI SHEET IS 277-120 GSM",
    "SS SHEET SS 304",
    "SS SHEET SS 441",
    "SS SHEET SS 430",
    "MS Chequered Plate",
    "SS Chequered Plate",
    "Other (specify in requirements)"
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.step') || file.name.toLowerCase().endsWith('.stp')) {
        setFormData({ ...formData, stepFile: file });
        toast({
          title: "File Uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a STEP file (.step or .stp)",
          variant: "destructive",
        });
      }
    }
  };

  const handleD2DraftUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setFormData({ ...formData, d2DraftDesign: file });
        toast({
          title: "2D Draft Design Uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file for the 2D Draft Design.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmitRequirements = async () => {
    if (!formData.partId || !/^[a-zA-Z0-9_-]+$/.test(formData.partId)) {
      toast({
        title: "Invalid PART ID",
        description: "Please enter a unique alphanumeric PART ID.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.d2DraftDesign) {
      toast({
        title: "Missing 2D Draft Design",
        description: "Please upload a 2D Draft Design PDF.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.productDescription || !formData.materialThickness || !formData.materialGrade || !formData.surfaceTreatment || !formData.packingStandard) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const backendForm = new FormData();
      backendForm.append("part_id", formData.partId);
      backendForm.append("d2_draft_design", formData.d2DraftDesign);
      backendForm.append("product_description", formData.productDescription);
      if (formData.stepFile) backendForm.append("step_file", formData.stepFile);
      backendForm.append("quantity", formData.quantity || "1");
      backendForm.append("material_type", formData.material);
      backendForm.append("material_thickness", formData.materialThickness);
      backendForm.append("material_grade", formData.materialGrade);
      backendForm.append("surface_treatment", formData.surfaceTreatment);
      backendForm.append("packing_standard", formData.packingStandard);
      if (formData.targetPrice) {
        backendForm.append("target_price", formData.targetPrice);
      }
      // Add any additional fields as needed
      await createOrder(backendForm);
      setStep(3);
      toast({
        title: "Requirements Submitted Successfully!",
        description: "Someone from our team will reach out to you within 24-48 hours.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit requirements. Please try again.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Requirements Submitted Successfully!</CardTitle>
            <CardDescription className="text-green-700">
              Your component requirements have been submitted and are now under review by our engineering team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">What happens next:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Our engineers will review your CAD file and requirements</li>
                <li>• We'll provide a detailed quotation based on your specifications</li>
                <li>• <strong>Someone from our team will reach out to you within 24-48 hours</strong></li>
                <li>• You'll receive our quote for review and approval</li>
                <li>• Payment will only be charged after you accept our pricing</li>
              </ul>
            </div>
            <div className="flex justify-center pt-4">
              <Button 
                onClick={onNavigateToHistory || (() => window.location.href = '/orders')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                View Order History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Component Requirements</CardTitle>
          <CardDescription>
            Please provide detailed specifications for your custom component manufacturing request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="part-id">PART ID *</Label>
                <Input
                  id="part-id"
                  type="text"
                  placeholder="e.g., P001, C002, etc."
                  value={formData.partId}
                  onChange={(e) => setFormData({ ...formData, partId: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description">Product Description *</Label>
                <Textarea
                  id="product-description"
                  placeholder="Describe the component you need manufactured..."
                  value={formData.productDescription}
                  onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-price">Target Price (optional)</Label>
                  <Input
                    id="target-price"
                    type="number"
                    placeholder="Enter your target price"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <div className="w-full min-w-[200px]">
                  <Select value={formData.material} onValueChange={(value) => setFormData({ ...formData, material: value })}>
                    <SelectTrigger
                      className="w-full min-w-[200px] bg-white text-black rounded-md"
                      style={{ border: "1px solid #d1d5db" }}
                    >
                      <SelectValue placeholder="Select a material" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 shadow-lg w-full min-w-[200px]">
                      {materialOptions.map((material) => (
                        <SelectItem key={material} value={material} className="hover:bg-gray-100 focus:bg-gray-100">
                          {material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material-thickness">Material Thickness *</Label>
                <Input
                  id="material-thickness"
                  type="text"
                  placeholder="e.g. 2mm"
                  value={formData.materialThickness}
                  onChange={(e) => setFormData({ ...formData, materialThickness: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-grade">Material Grade *</Label>
                <Input
                  id="material-grade"
                  type="text"
                  placeholder="e.g. 304, 316L, etc."
                  value={formData.materialGrade}
                  onChange={(e) => setFormData({ ...formData, materialGrade: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surface-treatment">Surface Treatment *</Label>
                <Input
                  id="surface-treatment"
                  type="text"
                  placeholder="e.g. Anodized, Painted, None"
                  value={formData.surfaceTreatment}
                  onChange={(e) => setFormData({ ...formData, surfaceTreatment: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packing-standard">Packing Standard *</Label>
                <Input
                  id="packing-standard"
                  type="text"
                  placeholder="e.g. Standard, Custom, etc."
                  value={formData.packingStandard}
                  onChange={(e) => setFormData({ ...formData, packingStandard: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tolerances">Tolerances</Label>
                <Input
                  id="tolerances"
                  placeholder="e.g., ±0.1mm, ±0.005in"
                  value={formData.tolerances}
                  onChange={(e) => setFormData({ ...formData, tolerances: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional-requirements">Additional Requirements</Label>
                <Textarea
                  id="additional-requirements"
                  placeholder="Any special requirements, surface finish, heat treatment, etc."
                  value={formData.additionalRequirements}
                  onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* PDF uploader first */}
              <div className="space-y-2">
                <Label htmlFor="d2-draft-design">2D Draft Design PDF *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  {formData.d2DraftDesign ? (
                    <div className="space-y-2">
                      <FileCheck className="h-12 w-12 text-green-600 mx-auto" />
                      <p className="text-sm font-medium text-green-800">{formData.d2DraftDesign.name}</p>
                      <p className="text-xs text-gray-600">File uploaded successfully</p>
                      <Button variant="outline" size="sm" onClick={() => setFormData({ ...formData, d2DraftDesign: null })}>
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <Label htmlFor="d2-draft-design" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            Click to upload 2D Draft Design PDF
                          </span>
                        </Label>
                        <Input
                          id="d2-draft-design"
                          type="file"
                          accept=".pdf"
                          onChange={handleD2DraftUpload}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Accepts PDF files up to 50MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* STEP uploader second */}
              <div className="space-y-2">
                <Label>STEP File Upload</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  {formData.stepFile ? (
                    <div className="space-y-2">
                      <FileCheck className="h-12 w-12 text-green-600 mx-auto" />
                      <p className="text-sm font-medium text-green-800">{formData.stepFile.name}</p>
                      <p className="text-xs text-gray-600">File uploaded successfully</p>
                      <Button variant="outline" size="sm" onClick={() => setFormData({ ...formData, stepFile: null })}>
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <Label htmlFor="step-file-upload" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            Click to upload STEP file
                          </span>
                        </Label>
                        <Input
                          id="step-file-upload"
                          type="file"
                          accept=".step,.stp"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Accepts .step and .stp files up to 50MB
                      </p>
                      <ul className="text-xs text-gray-500 text-left list-disc pl-4">
                        <li>• STEP format (.step or .stp)</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {formData.targetPrice && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">Target Price Note:</h4>
                  <p className="text-sm text-yellow-700">
                    Your target price of ₹{formData.targetPrice} will be considered during our quotation process. 
                    We'll work to meet your budget while maintaining quality standards.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <Button 
              onClick={handleSubmitRequirements}
              disabled={isSubmitting}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Requirements"}
              <CreditCard className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComponentRequirementsForm;
