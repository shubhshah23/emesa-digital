from rest_framework import serializers
from .models import Order, Machine, Supplier, OrderMessage

class OrderSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source='machine.name', read_only=True)
    supplier_name = serializers.CharField(source='machine.supplier.name', read_only=True)
    client_name = serializers.CharField(source='client.email', read_only=True)
    client_company = serializers.CharField(source='client.company', read_only=True)
    step_file_url = serializers.SerializerMethodField()
    d2_draft_design_url = serializers.SerializerMethodField()

    def get_step_file_url(self, obj):
        if obj.step_file and hasattr(obj.step_file, 'url'):
            # Use nginx port for static files
            return f"http://localhost:8080{obj.step_file.url}"
        return None

    def get_d2_draft_design_url(self, obj):
        if obj.d2_draft_design and hasattr(obj.d2_draft_design, 'url'):
            # Use nginx port for static files
            return f"http://localhost:8080{obj.d2_draft_design.url}"
        return None

    class Meta:
        model = Order
        fields = [
            'id', 'client', 'client_name', 'client_company', 'part_id', 'product_description', 
            'step_file', 'step_file_url', 'd2_draft_design', 'd2_draft_design_url', 'quantity', 'material_thickness', 'material_type', 
            'material_grade', 'surface_treatment', 'packing_standard', 'target_price', 'status',
            'date_submitted', 'expected_completion_date', 'machine', 'machine_name', 
            'supplier_name', 'admin_notes', 'rejection_reason', 'price_estimate', 
            'actual_cost', 'date_accepted', 'date_production_started', 
            'date_completed', 'date_rejected',
            'agreed_price', 'payment_confirmed'
        ]
        read_only_fields = ['status', 'date_submitted', 'client', 'client_name', 
                           'client_company', 'machine_name', 'supplier_name',
                           'date_accepted', 'date_production_started', 
                           'date_completed', 'date_rejected',
                           'agreed_price', 'payment_confirmed']

class OrderUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin updates to orders"""
    class Meta:
        model = Order
        fields = [
            'status', 'machine', 'expected_completion_date', 'admin_notes', 
            'rejection_reason', 'price_estimate', 'actual_cost', 'target_price'
        ]

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_info', 'email', 'phone', 'address']

class MachineSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    supplier_email = serializers.CharField(source='supplier.email', read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Machine
        fields = [
            'id', 'name', 'type', 'make', 'capacity', 'bed_size', 'tonnage', 'bed_length', 'supplier', 'supplier_name',
            'supplier_email', 'photo', 'photo_url'
        ]

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and hasattr(obj.photo, 'url'):
            if request:
                url = request.build_absolute_uri(obj.photo.url)
                # Always use port 8080 for media files
                url = url.replace('http://localhost/', 'http://localhost:8080/')
                url = url.replace('http://127.0.0.1/', 'http://localhost:8080/')
                return url
            return obj.photo.url
        return None

class OrderMessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.CharField(source='sender.email', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    class Meta:
        model = OrderMessage
        fields = ['id', 'order', 'sender', 'sender_email', 'sender_role', 'message', 'timestamp', 'is_admin', 'type', 'amount']
        read_only_fields = ['id', 'order', 'sender', 'sender_email', 'sender_role', 'timestamp', 'is_admin', 'type', 'amount'] 