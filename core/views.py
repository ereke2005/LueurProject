import json
import os
import uuid

import requests
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

# Ces valeurs restent côté serveur : elles ne sont jamais envoyées au navigateur.
VF_API_KEY = os.getenv('VF_API_KEY')
VF_VERSION_ID = os.getenv('VF_VERSION_ID', 'production')
VF_BASE_URL = 'https://general-runtime.voiceflow.com'


def home(request):
    # On s'assure qu'une session existe : son identifiant sert d'ID utilisateur
    # anonyme pour Voiceflow, sans jamais exposer le project ID / API key.
    if not request.session.session_key:
        request.session.create()
    return render(request, 'home.html')


def _vf_user_id(request):
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key


def _vf_request(user_id, action):
    """Relaie une action vers l'API Voiceflow, en gardant la clé côté serveur."""
    if not VF_API_KEY:
        return None, 'VF_API_KEY manquant côté serveur.'

    url = f'{VF_BASE_URL}/state/user/{user_id}/interact'
    headers = {
        'Authorization': VF_API_KEY,
        'Content-Type': 'application/json',
        'versionID': VF_VERSION_ID,
    }
    try:
        resp = requests.post(url, headers=headers, json={'action': action}, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as exc:
        return None, str(exc)
    return resp.json(), None


def _traces_to_messages(traces):
    """Transforme les traces Voiceflow en une structure simple pour le frontend."""
    messages = []
    end_of_conversation = False
    for trace in traces or []:
        ttype = trace.get('type')
        payload = trace.get('payload') or {}
        if ttype in ('text', 'speak'):
            text = payload.get('message') or payload.get('text') or ''
            if text:
                messages.append({'type': 'text', 'text': text})
        elif ttype == 'choice':
            buttons = [b.get('name') for b in payload.get('buttons', []) if b.get('name')]
            if buttons:
                messages.append({'type': 'choices', 'choices': buttons})
        elif ttype == 'end':
            end_of_conversation = True
    return messages, end_of_conversation


@require_POST
def chat_start(request):
    """Démarre (ou redémarre) la conversation."""
    user_id = _vf_user_id(request)
    data, error = _vf_request(user_id, {'type': 'launch'})
    if error:
        return JsonResponse({'error': error}, status=502)
    messages, ended = _traces_to_messages(data)
    return JsonResponse({'messages': messages, 'ended': ended})


@require_POST
def chat_interact(request):
    """Envoie un message utilisateur et renvoie la réponse du bot."""
    try:
        body = json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Requête invalide.'}, status=400)

    text = (body.get('message') or '').strip()
    if not text:
        return JsonResponse({'error': 'Message vide.'}, status=400)

    user_id = _vf_user_id(request)
    data, error = _vf_request(user_id, {'type': 'text', 'payload': text})
    if error:
        return JsonResponse({'error': error}, status=502)
    messages, ended = _traces_to_messages(data)
    return JsonResponse({'messages': messages, 'ended': ended})