from django.db import models

class Payment(models.Model):
    user_id = models.CharField(max_length=255)
    transaction_id = models.CharField(max_length=255, unique=True)
    amount = models.IntegerField()
    currency = models.CharField(max_length=10, default="eur")
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_id} - {self.transaction_id} - {self.status}"
