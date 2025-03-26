from django.urls import path, include
from rest_framework import routers
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from . import views
 
 
schema_view = get_schema_view(
   openapi.Info(
      title="Payments API",
      default_version='v1',
      description="API for Payments, integrating with Stripe",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@yourdomain.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
)

urlpatterns = [
    path('payments/', views.CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('payments/<str:payment_id>/confirm', views.ConfirmPaymentView.as_view(), name='confirm-payment'),
    path('payments/<str:payment_id>', views.PaymentStatusView.as_view(), name='payment-status'),
    path('payments/<str:user_id>/history', views.PaymentHistoryView.as_view(), name='payment-history'),
    path('payments/<str:payment_id>/refund', views.RefundPaymentView.as_view(), name='refund-payment'),
]
