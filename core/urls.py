from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/chat/start/', views.chat_start, name='chat_start'),
    path('api/chat/message/', views.chat_interact, name='chat_interact'),
]