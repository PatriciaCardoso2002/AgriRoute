from django.urls import path
from .views import CreatePaymentIntentView, ConfirmPaymentView

urlpatterns = [
    path("payments/", CreatePaymentIntentView.as_view(), name="create-payment"),
    path("payments/<str:payment_intent_id>/confirm", ConfirmPaymentView.as_view(), name="confirm-payment"),
]
