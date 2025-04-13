
import json
import stripe
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from payment_app.models import Payment

stripe.api_key = settings.STRIPE_TEST_SECRET_KEY

@csrf_exempt
def create_payment(request):
    try:
        intent = stripe.PaymentIntent.create(
            amount=1000,  # €10
            currency='eur',
            metadata={"integration_check": "accept_a_payment"}
        )
        
        return JsonResponse({'clientSecret': intent.client_secret})

    except Exception as e:
        print("❌ ERRO:", e)
        return JsonResponse({"error": str(e)}, status=500)

