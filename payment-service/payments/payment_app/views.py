import json
import stripe
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

stripe.api_key = settings.STRIPE_TEST_SECRET_KEY

@swagger_auto_schema(
    method='post',
    operation_description="Criação de um PaymentIntent",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'user_id': openapi.Schema(type=openapi.TYPE_STRING, description="ID do user"),
            'amount': openapi.Schema(type=openapi.TYPE_INTEGER, description="Valor do pagamento em cêntimos"),
            'description': openapi.Schema(type=openapi.TYPE_STRING, description="Descrição do pagamento")
        }
    ),
    responses={
        200: openapi.Response(
            description="Sucesso: retorna client_secret e payment_intent ID",
            examples={
                "application/json": {
                    "clientSecret": "pi_123_secret_abc",
                    "payment_intent": "pi_123"
                }
            }
        ),
        500: openapi.Response(description="Erro interno do servidor")
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
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