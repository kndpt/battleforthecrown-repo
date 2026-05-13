# Worktree dev servers

Quand on travaille dans un worktree parallèle, ne pas réutiliser forcément le port frontend principal `5173`. Le navigateur doit pointer vers le serveur Vite lancé depuis le worktree courant, avec les variables d'environnement explicites.

## Pourquoi

- `5173` peut déjà être occupé par le checkout principal ou une autre session.
- Le frontend Pixi plante au boot si `VITE_API_BASE_URL` ou `VITE_WS_URL` manque.
- Le backend limite le CORS via `FRONTEND_URL`; il doit correspondre au port Vite utilisé par le worktree.

## Lancement recommandé

Depuis la racine du worktree :

```bash
yarn install

cd battleforthecrown-backend && docker compose up -d
cd ..

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/battleforthecrown" \
  yarn workspace battleforthecrown-backend prisma migrate deploy

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/battleforthecrown" \
  yarn workspace battleforthecrown-backend prisma generate

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/battleforthecrown" \
JWT_ACCESS_SECRET="dev-local-jwt-access-secret-32-bytes" \
FRONTEND_URL="http://localhost:5174" \
NODE_ENV=development \
PORT=15001 \
  yarn workspace battleforthecrown-backend start:dev
```

Dans un second terminal :

```bash
VITE_API_BASE_URL="http://localhost:15001" \
VITE_WS_URL="http://localhost:15001" \
  yarn workspace battleforthecrown-pixi dev --port 5174 --strictPort
```

Ouvrir ensuite dans le navigateur :

- App : `http://localhost:5174/`
- Design system : `http://localhost:5174/design-system`
- Backend health : `http://localhost:15001/health`

## Si un port est déjà pris

Choisir un autre port frontend, puis garder les trois valeurs alignées :

```bash
FRONTEND_URL="http://localhost:<front-port>"
VITE_API_BASE_URL="http://localhost:15001"
VITE_WS_URL="http://localhost:15001"
yarn workspace battleforthecrown-pixi dev --port <front-port> --strictPort
```

Le port backend peut aussi changer si `15001` est pris, mais il faut alors mettre à jour `VITE_API_BASE_URL` et `VITE_WS_URL` avec ce nouveau port.

## Symptômes connus

| Symptôme | Cause | Fix |
|---|---|---|
| Écran bleu / page vide | `VITE_API_BASE_URL` ou `VITE_WS_URL` absent | Redémarrer Vite avec les deux variables. |
| Requêtes bloquées par CORS | `FRONTEND_URL` backend ne correspond pas au port Vite | Redémarrer le backend avec `FRONTEND_URL=http://localhost:<front-port>`. |
| Backend compile mais ne démarre pas | `JWT_ACCESS_SECRET` absent | Ajouter un secret dev local explicite. |
| Erreurs Prisma types manquants | Client Prisma pas généré dans le worktree | Lancer `prisma generate`. |
