from django.db import models
from django.conf import settings

# Create your models here.

class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_info = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Machine(models.Model):
    MACHINE_TYPE_CHOICES = [
        ('laser', 'Laser'),
        ('bending', 'Bending'),
        ('punch', 'Punch'),
    ]
    
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='machines')
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100, choices=MACHINE_TYPE_CHOICES, default='laser')
    make = models.CharField(max_length=255)
    capacity = models.CharField(max_length=100, blank=True)  # For laser
    bed_size = models.CharField(max_length=100, blank=True)  # For laser, punch
    tonnage = models.CharField(max_length=100, blank=True)   # For bending, punch
    bed_length = models.CharField(max_length=100, blank=True) # For bending
    
    photo = models.ImageField(upload_to='machine_photos/', null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.supplier.name})"

# Update Order model to include machine assignment
class Order(models.Model):
    STATUS_CHOICES = [
        ('under_review', 'Under Review'),
        ('negotiation', 'Negotiation'),  # NEW: explicit negotiation state
        ('awaiting_payment', 'Awaiting Payment'),  # NEW: after agreement, before payment
        ('accepted', 'Accepted'),
        ('in_production', 'In Production'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    part_id = models.CharField(max_length=32, unique=True)  # NEW FIELD
    product_description = models.TextField()
    step_file = models.FileField(upload_to='step_files/', blank=True, null=True)  # Now optional
    d2_draft_design = models.FileField(upload_to='draft_designs/', blank=False, null=False)  # NEW FIELD, required
    quantity = models.PositiveIntegerField()
    material_thickness = models.CharField(max_length=100)
    material_type = models.CharField(max_length=100)
    material_grade = models.CharField(max_length=100)
    surface_treatment = models.CharField(max_length=100)
    packing_standard = models.CharField(max_length=100)
    target_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # NEW FIELD
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='under_review')
    date_submitted = models.DateTimeField(auto_now_add=True)
    expected_completion_date = models.DateField(null=True, blank=True)
    machine = models.ForeignKey(Machine, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    
    # Additional fields for admin notes and client communication
    admin_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    price_estimate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    agreed_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # NEW: agreed price after negotiation
    payment_confirmed = models.BooleanField(default=False)  # NEW: payment confirmation flag
    
    # Timestamps for status changes
    date_accepted = models.DateTimeField(null=True, blank=True)
    date_production_started = models.DateTimeField(null=True, blank=True)
    date_completed = models.DateTimeField(null=True, blank=True)
    date_rejected = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Order {self.id} by {self.client.email} - {self.status}"

    class Meta:
        ordering = ['-date_submitted']

class OrderMessage(models.Model):
    MESSAGE_TYPE_CHOICES = [
        ('message', 'Message'),
        ('counter_offer', 'Counter Offer'),
        ('system', 'System'),
    ]
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_admin = models.BooleanField(default=False)  # For convenience, but can also infer from sender.role
    type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES, default='message')  # NEW: message type
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # NEW: for counter offers

    def __str__(self):
        return f"Message by {self.sender.email} on Order {self.order.id}"

    class Meta:
        ordering = ['timestamp']
