from django.contrib import admin
from .models import Supplier, Machine, Order

# Register your models here.

admin.site.register(Supplier)
admin.site.register(Machine)
admin.site.register(Order)
