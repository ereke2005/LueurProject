# Lueur

Site web incluant un chatbot (Voiceflow) permettant de dénoncer le cyberharcèlement.

## Architecture chat

Le navigateur ne communique **jamais** directement avec Voiceflow et ne
connaît jamais le project ID / API key. Le widget maison (`static/js/app.js`)
envoie les messages à ton propre backend Django (`/api/chat/start/` et
`/api/chat/message/`), qui relaie l'appel vers l'API Voiceflow
(`general-runtime.voiceflow.com`) avec la clé API lue depuis une variable
d'environnement serveur (`VF_API_KEY`). Seule la réponse texte revient au
navigateur.

## Déploiement sur Render

1. Pousse ce projet sur un dépôt Git (GitHub/GitLab).
2. Sur Render : **New > Web Service**, connecte le dépôt.
3. Build command : `pip install -r requirements.txt`
4. Start command : `gunicorn config.wsgi:application`
5. Ajoute les variables d'environnement (voir `.env.example`) :
   - `SECRET_KEY`
   - `DEBUG=False`
   - `VF_API_KEY` (clé Dialog API Voiceflow, jamais dans le code ni le repo)
   - `VF_VERSION_ID` (par défaut `production`)
6. `ALLOWED_HOSTS` se configure automatiquement via `RENDER_EXTERNAL_HOSTNAME`,
   fourni par Render.
7. La base SQLite est incluse mais le disque de Render est **éphémère** en
   plan gratuit (les données sont perdues à chaque redeploy). Pour de la
   persistance, ajoute une base Postgres Render et adapte `DATABASES` dans
   `config/settings.py`.

## Développement local

```bash
pip install -r requirements.txt
cp .env.example .env   # puis renseigne VF_API_KEY
python manage.py migrate
python manage.py runserver
```
