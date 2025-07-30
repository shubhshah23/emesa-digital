from django.core.management.base import BaseCommand
from orders.models import Order
import uuid

class Command(BaseCommand):
    help = 'Fix orders with NULL part_id by generating proper part IDs'

    def handle(self, *args, **options):
        # Find all orders with 'NULL' part_id
        null_part_id_orders = Order.objects.filter(part_id='NULL')
        
        if not null_part_id_orders.exists():
            self.stdout.write(
                self.style.SUCCESS('No orders with NULL part_id found.')
            )
            return
        
        self.stdout.write(f'Found {null_part_id_orders.count()} orders with NULL part_id')
        
        for order in null_part_id_orders:
            # Generate a unique part ID based on order ID and a short UUID
            new_part_id = f"PART-{order.id}-{str(uuid.uuid4())[:8].upper()}"
            
            # Check if this part_id already exists (shouldn't happen, but just in case)
            while Order.objects.filter(part_id=new_part_id).exists():
                new_part_id = f"PART-{order.id}-{str(uuid.uuid4())[:8].upper()}"
            
            # Update the order
            order.part_id = new_part_id
            order.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Updated Order #{order.id}: {new_part_id}')
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {null_part_id_orders.count()} orders')
        ) 