
import json
import stripe
from django.conf import settings
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework import status
from .models import Payment  # Certifique-se de ter o modelo
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

stripe.api_key = settings.STRIPE_TEST_SECRET_KEY


@method_decorator(csrf_exempt, name='dispatch')
class CreatePaymentIntentView(APIView):
    def post(self, request):
        try:
            data = json.loads(request.body)
            amount = data["amount"]
            user_id = data["user_id"]

            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency="eur",
                automatic_payment_methods={
                'enabled': True,  # Habilita o uso automático de métodos de pagamento
                 },
            )
            
            Payment.objects.create(
                user_id=user_id,
                transaction_id=intent.id,
                amount=amount,
                currency="eur",
                status="created",
            )

            return JsonResponse({"transaction_id": intent.id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class ConfirmPaymentView(APIView):
    def post(self, request, payment_intent_id):
        try:
            data = json.loads(request.body)

            intent = stripe.PaymentIntent.confirm(
                payment_intent_id,
            )
            
            payment = Payment.objects.filter(transaction_id=payment_intent_id).first()
            if payment:
                payment.status = intent.status
                payment.save()
            print("Dados recebidos:", data)

            return JsonResponse({"status": intent.status})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
