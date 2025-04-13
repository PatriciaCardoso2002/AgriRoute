import json
import stripe
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.decorators import api_view

stripe.api_key = settings.STRIPE_TEST_SECRET_KEY

@csrf_exempt
@api_view(['POST'])
@swagger_auto_schema(
    operation_description="Create Payment Intent",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'user_id': openapi.Schema(type=openapi.TYPE_STRING, description="User ID"),
            'amount': openapi.Schema(type=openapi.TYPE_INTEGER, description="Payment Amount (€)"),
            'description': openapi.Schema(type=openapi.TYPE_STRING, description="Payment Description")
        },
    ),
    responses={
        200: openapi.Response(
            description="Returns Client Secret and PaymentIntent ID",
            examples={
                'application/json': {
                    'clientSecret': 'secret_key',
                    'payment_intent': 'payment_intent_id'
                }
            }
        ),
        500: openapi.Response(
            description="Erro interno do servidor",
            examples={
                'application/json': {'error': 'Erro na criação do pagamento'}
            }
        ),
    }
)


def create_payment(request):
    try:
        data = json.loads(request.body)
        intent = stripe.PaymentIntent.create(
            amount=data.get('amount'),
            currency='eur',
            metadata={"integration_check": "accept_a_payment",
                      "user_id": data.get('user_id'),
                      'description': data.get('description')},
        )
        
        return JsonResponse({'clientSecret': intent.client_secret , 'payment_intent': intent.id})

    except Exception as e:
        print("❌ ERRO:", e)
        return JsonResponse({"error": str(e)}, status=500)