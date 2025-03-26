from django.db import models

class Payment(models.Model):
    transaction_id = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='eur')
    description = models.TextField()
    user_id = models.CharField(max_length=255) 
    status = models.CharField(max_length=50, choices=[('started', 'Started'), ('succeeded', 'Succeeded'), ('failed', 'Failed'), ('refunded', 'Refunded')])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.transaction_id} for {self.amount} {self.currency}"
