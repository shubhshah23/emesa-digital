from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import OrderViewSet, SupplierViewSet, MachineViewSet, OrderMessageListCreateView

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'machines', MachineViewSet, basename='machine')

urlpatterns = router.urls + [
    path('orders/<int:order_id>/messages/', OrderMessageListCreateView.as_view(), name='order-messages'),
] 