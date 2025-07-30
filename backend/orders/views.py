from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Order, Machine, Supplier, OrderMessage
from .serializers import OrderSerializer, OrderUpdateSerializer, SupplierSerializer, MachineSerializer, OrderMessageSerializer
from rest_framework import generics

# Create your views here.

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().select_related('machine', 'machine__supplier', 'client')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Allow both Django is_staff and custom user.role == 'admin' to see all orders
        if user.is_staff or getattr(user, 'role', None) == 'admin':
            return Order.objects.all().select_related('machine', 'machine__supplier', 'client')
        return Order.objects.filter(client=user).select_related('machine', 'machine__supplier', 'client')

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve_order(self, request, pk=None):
        """Approve an order and optionally assign a machine"""
        order = self.get_object()
        user = request.user
        
        # Check if user is admin
        if not (user.is_staff or getattr(user, 'role', None) == 'admin'):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        machine_id = request.data.get('machine_id')
        expected_completion_date = request.data.get('expected_completion_date')
        price_estimate = request.data.get('price_estimate')
        admin_notes = request.data.get('admin_notes', '')
        
        try:
            # Admin accepts client's target price
            if not price_estimate and order.target_price:
                order.price_estimate = order.target_price
                order.agreed_price = order.target_price  # Immediate agreement
            # Admin counters with different price
            elif price_estimate:
                order.price_estimate = price_estimate
                # Don't set agreed_price - client needs to accept this counter offer
            order.status = 'awaiting_payment'
            order.date_accepted = timezone.now()
            order.admin_notes = admin_notes
            if expected_completion_date:
                order.expected_completion_date = expected_completion_date
            else:
                order.expected_completion_date = timezone.now().date() + timedelta(days=14)
            if machine_id:
                try:
                    machine = Machine.objects.get(id=machine_id)
                    order.machine = machine
                except Machine.DoesNotExist:
                    return Response({'error': 'Machine not found or not available'}, status=status.HTTP_400_BAD_REQUEST)
            order.save()
            return Response({
                'message': 'Order approved successfully',
                'order': OrderSerializer(order).data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject_order(self, request, pk=None):
        """Reject an order with a reason"""
        order = self.get_object()
        user = request.user
        
        # Check if user is admin
        if not (user.is_staff or getattr(user, 'role', None) == 'admin'):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        rejection_reason = request.data.get('rejection_reason', '')
        if not rejection_reason:
            return Response({'error': 'Rejection reason is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = 'rejected'
        order.rejection_reason = rejection_reason
        order.date_rejected = timezone.now()
        order.save()
        
        return Response({
            'message': 'Order rejected successfully',
            'order': OrderSerializer(order).data
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start_production(self, request, pk=None):
        """Start production for an approved order. Machine must be assigned."""
        order = self.get_object()
        user = request.user
        # Check if user is admin
        if not (user.is_staff or getattr(user, 'role', None) == 'admin'):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        if order.status != 'accepted':
            return Response({'error': 'Order must be accepted before starting production'}, status=status.HTTP_400_BAD_REQUEST)
        if not order.machine:
            return Response({'error': 'A machine must be assigned before starting production.'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = 'in_production'
        order.date_production_started = timezone.now()
        order.save()
        return Response({
            'message': 'Production started successfully',
            'order': OrderSerializer(order).data
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def complete_order(self, request, pk=None):
        """Mark an order as completed"""
        order = self.get_object()
        user = request.user
        
        # Check if user is admin
        if not (user.is_staff or getattr(user, 'role', None) == 'admin'):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        if order.status != 'in_production':
            return Response({'error': 'Order must be in production before marking as completed'}, status=status.HTTP_400_BAD_REQUEST)
        
        actual_cost = request.data.get('actual_cost')
        
        order.status = 'completed'
        order.date_completed = timezone.now()
        if actual_cost:
            order.actual_cost = actual_cost
        order.save()
        
        return Response({
            'message': 'Order completed successfully',
            'order': OrderSerializer(order).data
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def assign_machine(self, request, pk=None):
        """Assign a machine to an order"""
        order = self.get_object()
        user = request.user
        
        # Check if user is admin
        if not (user.is_staff or getattr(user, 'role', None) == 'admin'):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        machine_id = request.data.get('machine_id')
        if not machine_id:
            return Response({'error': 'Machine ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            machine = Machine.objects.get(id=machine_id)
            order.machine = machine
            order.save()
            
            return Response({
                'message': 'Machine assigned successfully',
                'order': OrderSerializer(order).data
            })
        except Machine.DoesNotExist:
            return Response({'error': 'Machine not found or not available'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def confirm_price(self, request, pk=None):
        """Client confirms the quoted price and accepts the order."""
        order = self.get_object()
        user = request.user
        if getattr(user, 'role', None) != 'client' or order.client != user:
            return Response({'error': 'Only the client who created the order can confirm.'}, status=status.HTTP_403_FORBIDDEN)
        if order.status not in ['under_review', 'accepted']:
            return Response({'error': 'Order cannot be confirmed at this stage.'}, status=status.HTTP_400_BAD_REQUEST)
        # Set agreed_price to the price_estimate when client confirms
        if order.price_estimate:
            order.agreed_price = order.price_estimate
        order.status = 'accepted'
        order.save()
        # Optionally, create a system chat message
        from .models import OrderMessage
        OrderMessage.objects.create(
            order=order,
            sender=user,
            message=f'Client confirmed the order at price ₹{order.price_estimate or "(not set)"}.',
            is_admin=False
        )
        return Response({'message': 'Order confirmed at price.', 'order': OrderSerializer(order).data})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def send_counter_offer(self, request, pk=None):
        """Send a counter offer (admin or client) with amount and message."""
        order = self.get_object()
        user = request.user
        amount = request.data.get('amount')
        message = request.data.get('message', '')
        if not amount:
            return Response({'error': 'Amount is required for counter offer.'}, status=status.HTTP_400_BAD_REQUEST)
        # Only allow if order is under_review or negotiation
        if order.status not in ['under_review', 'negotiation']:
            return Response({'error': 'Negotiation not allowed at this stage.'}, status=status.HTTP_400_BAD_REQUEST)
        # Create counter offer message
        OrderMessage.objects.create(
            order=order,
            sender=user,
            message=message or f'Counter offer: ₹{amount}',
            is_admin=(user.is_staff or getattr(user, 'role', None) == 'admin'),
            type='counter_offer',
            amount=amount
        )
        # Move order to negotiation if not already
        if order.status != 'negotiation':
            order.status = 'negotiation'
            order.save()
        return Response({'message': 'Counter offer sent.'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept_counter_offer(self, request, pk=None):
        """Client accepts the latest counter offer, sets agreed_price, moves to awaiting_payment."""
        order = self.get_object()
        user = request.user
        if getattr(user, 'role', None) != 'client' or order.client != user:
            return Response({'error': 'Only the client who created the order can accept.'}, status=status.HTTP_403_FORBIDDEN)
        if order.status != 'negotiation':
            return Response({'error': 'Order is not in negotiation.'}, status=status.HTTP_400_BAD_REQUEST)
        # Find latest counter offer
        last_offer = order.messages.filter(type='counter_offer').order_by('-timestamp').first()
        if not last_offer:
            return Response({'error': 'No counter offer to accept.'}, status=status.HTTP_400_BAD_REQUEST)
        order.agreed_price = last_offer.amount
        order.status = 'awaiting_payment'
        order.save()
        # System message
        OrderMessage.objects.create(
            order=order,
            sender=user,
            message=f'Client accepted the offer of ₹{last_offer.amount}.',
            is_admin=False,
            type='system'
        )
        return Response({'message': 'Counter offer accepted. Awaiting payment.', 'order': OrderSerializer(order).data})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def confirm_payment(self, request, pk=None):
        """Client confirms payment after agreement. Moves order to accepted."""
        order = self.get_object()
        user = request.user
        if getattr(user, 'role', None) != 'client' or order.client != user:
            return Response({'error': 'Only the client who created the order can confirm payment.'}, status=status.HTTP_403_FORBIDDEN)
        if order.status != 'awaiting_payment':
            return Response({'error': 'Order is not awaiting payment.'}, status=status.HTTP_400_BAD_REQUEST)
        order.payment_confirmed = True
        order.status = 'accepted'
        order.save()
        # System message
        OrderMessage.objects.create(
            order=order,
            sender=user,
            message=f'Client confirmed payment for agreed price ₹{order.agreed_price}.',
            is_admin=False,
            type='system'
        )
        return Response({'message': 'Payment confirmed. Order accepted.', 'order': OrderSerializer(order).data})

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]

class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all().select_related('supplier')
    serializer_class = MachineSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def available(self, request):
        """Get all machines (no is_available filter)"""
        machines = Machine.objects.all().select_related('supplier')
        serializer = self.get_serializer(machines, many=True)
        return Response(serializer.data)

class OrderMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        order_id = self.kwargs['order_id']
        return OrderMessage.objects.filter(order_id=order_id).select_related('sender')

    def perform_create(self, serializer):
        order_id = self.kwargs['order_id']
        order = Order.objects.get(id=order_id)
        is_admin = self.request.user.role == 'admin' if hasattr(self.request.user, 'role') else self.request.user.is_staff
        serializer.save(order=order, sender=self.request.user, is_admin=is_admin)
