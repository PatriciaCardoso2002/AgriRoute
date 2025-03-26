import stripe
from django.conf import settings
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from .models import Payment
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

stripe.api_key = settings.STRIPE_TEST_SECRET_KEY

class CreatePaymentIntentView(APIView):
    @swagger_auto_schema(
        operation_description="Cria um PaymentIntent no Stripe para realizar o pagamento.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'amount': openapi.Schema(type=openapi.TYPE_INTEGER, description="Valor do pagamento."),
                'description': openapi.Schema(type=openapi.TYPE_STRING, description="Descrição do produto."),
                'user_id': openapi.Schema(type=openapi.TYPE_STRING, description="ID do produtor.")
            },
        ),
        responses={
            200: openapi.Response(
                description="PaymentIntent criado com sucesso.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'transaction_id': openapi.Schema(type=openapi.TYPE_STRING, description="ID da transação.")
                    }
                ),
            ),
            400: "Erro ao criar o PaymentIntent."
        }
    )
    def post(self, request):
        try:
            amount = int(request.data.get('amount')) 
            description = request.data.get('description')
            user_id = request.data.get('user_id')

            # Criação do PaymentIntent
            payment_intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='eur',
                description=description,
                metadata={'user_id': user_id}
            )

            payment = Payment.objects.create(
                transaction_id=payment_intent.id,
                amount=amount / 100,  
                currency='eur',
                description=description,
                user_id=user_id,
                status='started'
            )

            return JsonResponse({
                'transaction_id': payment.transaction_id
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

class ConfirmPaymentView(APIView):
    @swagger_auto_schema(
        operation_description="Confirma um pagamento no Stripe com o método de pagamento.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'payment_method': openapi.Schema(type=openapi.TYPE_STRING, description="Método de pagamento (Exemplo: 'VISA')."),
                'return_url': openapi.Schema(type=openapi.TYPE_STRING, description="URL para redirecionamento após o pagamento.")
            },
        ),
        responses={
            200: openapi.Response(
                description="Status do pagamento atualizado com sucesso.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, description="Status do PaymentIntent após confirmação.")
                    }
                ),
            ),
            400: "Erro ao confirmar o pagamento."
        }
    )
    def post(self, request, payment_intent_id):
        try:
            payment_method = request.data.get('payment_method')
            return_url = request.data.get('return_url')

            payment_intent = stripe.PaymentIntent.confirm(
                payment_intent_id,
                payment_method=payment_method,
                return_url=return_url
            )

            payment = Payment.objects.get(transaction_id=payment_intent_id)
            payment.status = payment_intent.status
            payment.save()

            return JsonResponse({
                'status': payment_intent.status
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

class PaymentStatusView(APIView):
    @swagger_auto_schema(
        operation_description="Obtém o status do pagamento.",
        responses={
            200: openapi.Response(
                description="Status do pagamento.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, description="Status do PaymentIntent.")
                    }
                ),
            ),
            400: "Erro ao obter o status do PaymentIntent."
        }
    )
    def get(self, request, payment_intent_id):
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            return JsonResponse({
                'status': payment_intent.status
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

class RefundPaymentView(APIView):
    @swagger_auto_schema(
        operation_description="Solicita o reembolso de um pagamento.",
        responses={
            200: openapi.Response(
                description="Reembolso realizado com sucesso.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING, description="Status do reembolso.")
                    }
                ),
            ),
            400: "Erro ao solicitar reembolso."
        }
    )
    def post(self, request, transaction_id):
        try:
            payment_intent = stripe.PaymentIntent.retrieve(transaction_id)

            refund = stripe.Refund.create(payment_intent=payment_intent.id)

            payment = Payment.objects.get(transaction_id=transaction_id)
            payment.status = 'refunded'
            payment.save()

            return JsonResponse({'status': 'Refunded'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

class PaymentHistoryView(APIView):
    @swagger_auto_schema(
        operation_description="Obtém o histórico de pagamentos de um produtor.",
        responses={
            200: openapi.Response(
                description="Histórico de pagamentos do produtor.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'payments': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    'transaction_id': openapi.Schema(type=openapi.TYPE_STRING, description="ID da transação."),
                                    'amount': openapi.Schema(type=openapi.TYPE_NUMBER, description="Valor da transação."),
                                    'currency': openapi.Schema(type=openapi.TYPE_STRING, description="Moeda usada na transação."),
                                    'status': openapi.Schema(type=openapi.TYPE_STRING, description="Status da transação."),
                                    'description': openapi.Schema(type=openapi.TYPE_STRING, description="Descrição do pagamento."),
                                }
                            ),
                        )
                    }
                ),
            ),
            400: "Erro ao obter histórico de pagamentos."
        }
    )
    def get(self, request, user_id):

        payments = Payment.objects.filter(user_id=user_id)
        payment_data = []

        for payment in payments:
            payment_data.append({
                'transaction_id': payment.transaction_id,
                'amount': payment.amount,
                'currency': payment.currency,
                'status': payment.status,
                'description': payment.description
            })

        return JsonResponse({'payments': payment_data})