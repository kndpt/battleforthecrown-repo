# Writing style — micro-copies UI

Tone & voice pour toutes les chaînes affichées au joueur : boutons, labels, tooltips, toasts, erreurs, placeholders, empty states, écrans de chargement, confirmations.

> Voir aussi : [`ui-library.md`](./ui-library.md), [`ui-design-system.md`](./ui-design-system.md). Tout le contenu UI est en **français**.

## Tone général

**Médiéval avec ironie douce et anachronismes subtils.** L'univers est sérieux (royaume, expéditions, conquêtes) mais le ton accepte une dose de second degré quand l'enjeu est faible. Pas de memes modernes, pas de références pop directes. Des clins d'œil discrets : "scribes", "parchemins", "hydromel", "le grand livre du royaume" pour parler du backend.

**Référent linguistique** : le joueur est tutoyé. Il est un **seigneur / suzerain / prince**, jamais un "user" ou un "joueur".

## Règle critique : doser l'humour selon l'enjeu

| Contexte                                | Ton                  | Exemple                                                    |
|-----------------------------------------|----------------------|------------------------------------------------------------|
| Action triviale (chargement, succès léger) | Ironique, taquin   | "Les paysans ramassent du bois…"                           |
| Erreur récupérable (validation form)    | Légèrement décalé    | "Mot de passe incorrect — les gardes ne sont pas convaincus." |
| Erreur système (500, timeout)           | Ironie + transparence | "Les dieux du backend sont en colère (500). Réessaie."   |
| **Combat perdu, troupes décimées**      | **Sobre, factuel**   | **"Défaite. 47 unités perdues. Le rapport est dans la chronique."** |
| **Village conquis (subi)**              | **Sobre, urgent**    | **"Ton village a été pris. Les survivants se sont repliés."** |
| **Action irréversible (suppression de compte)** | Direct, sérieux | "Cette action est définitive. Confirme-tu ?"              |

**Règle d'or** : on n'est jamais drôle quand le joueur perd quelque chose qui lui a coûté du temps réel. L'humour est réservé aux moments où l'enjeu est purement cosmétique ou positif.

## Catalogue par contexte

### Auth (login / register / refresh)

- **CTA primaire** : "Entrer dans le royaume", "Rejoindre la cour", "Sceller l'inscription"
- **CTA secondaire** : "Revenir au conseil", "Repartir vers la taverne"
- **Placeholder email** : "ton-nom@royaume.fr"
- **Placeholder mot de passe** : "Ton mot secret"
- **Erreur creds** : "Mot secret incorrect — les gardes ne te laissent pas passer."
- **Erreur 401** : "Session expirée. Le héraut t'a perdu de vue — reconnecte-toi."

### Loading & progression

Phrases courtes, présent narratif, animation paysanne :

- "Les paysans ramassent du bois…"
- "Les éclaireurs explorent la carte…"
- "Les scribes synchronisent avec le grand livre…"
- "Les forgerons aiguisent les épées…"
- "Les architectes consultent les plans…"
- "Les ouvriers prennent une gorgée d'hydromel…" *(à utiliser avec parcimonie pour les chargements > 3 s)*

### Erreurs serveur

| Code  | Phrase                                                                       |
|-------|------------------------------------------------------------------------------|
| 400   | "Le parchemin est mal rédigé. Vérifie tes informations."                     |
| 401   | "Le héraut ne te reconnaît plus — reconnecte-toi."                           |
| 403   | "Ce domaine ne t'appartient pas."                                            |
| 404   | "Introuvable — sans doute pillé récemment."                                  |
| 409   | "Conflit dans les registres royaux. Recommence."                             |
| 429   | "Tu vas trop vite pour les scribes. Patiente un instant."                    |
| 500   | "Les dieux du backend sont en colère (500). Réessaie dans un instant."       |
| 503   | "Le château est temporairement fermé. Reviens vite."                         |

### Succès d'action

- **Construction lancée** : "Construction lancée — les marteaux résonnent déjà."
- **Recrutement lancé** : "Les recrues rejoignent la garnison."
- **Upgrade terminé** : "Bâtiment amélioré au niveau {N}."
- **Combat envoyé** : "Tes troupes marchent vers ({x}, {y})."
- **Combat gagné** : "Victoire. Le butin est en route."
- **Conquête réussie** : "Le village est désormais sous ton autorité."

### Combat (catégorie sensible — voir règle critique ci-dessus)

| Issue              | Phrase                                                                   |
|--------------------|--------------------------------------------------------------------------|
| Victoire propre    | "Victoire écrasante. Aucune perte."                                      |
| Victoire normale   | "Victoire. {N} unités perdues. Le butin revient au village."             |
| Défaite légère     | "Défaite. La garnison ennemie était mieux préparée."                     |
| Défaite lourde     | "Défaite. {N} unités perdues. Voir le rapport pour le détail."           |
| Repoussé en attaque (PvP défense réussie) | "Tu as repoussé l'attaque de {pseudo}." |
| Pillage subi       | "{pseudo} t'a pillé : {wood}/{stone}/{iron} ressources perdues."         |
| Village pris       | "Ton village {nom} a été conquis par {pseudo}."                          |

### Tooltips d'aide

- "Astuce : les murailles ne se construisent pas avec des promesses."
- "Astuce : un éclaireur vaut dix soldats — pour ce qui est de voir au loin."
- "Astuce : une caserne au repos est une caserne qui rouille."
- "Astuce : le trésor royal n'aime pas l'attente."

### Boutons : alternatives "thématiques"

À utiliser quand la longueur le permet. Si l'espace est contraint, retomber sur les libellés sobres entre parenthèses.

| Action            | Libellé thématique             | Sobre fallback   |
|-------------------|--------------------------------|------------------|
| Confirmer         | "Sceller le parchemin"         | "Confirmer"      |
| Annuler           | "Revenir au conseil"           | "Annuler"        |
| Sauvegarder       | "Consigner dans la chronique"  | "Enregistrer"    |
| Supprimer         | "Brûler le parchemin"          | "Supprimer"      |
| Envoyer (combat)  | "Envoyer les troupes"          | "Attaquer"       |
| Recruter          | "Lever la garde"               | "Recruter"       |
| Améliorer         | "Élever le bâtiment"           | "Améliorer"      |

### Empty states

- **Pas de villages** : "Tu n'as pas encore fondé de village. Le royaume t'attend."
- **Pas de rapport de combat** : "Aucun rapport. Le silence règne sur tes terres."
- **Pas d'expédition en cours** : "Tes troupes attendent tes ordres."
- **Pas de barbares en vue** : "L'horizon est calme. Les éclaireurs n'ont rien repéré."

### Confirmations destructives

Sobre + transparence sur l'irréversibilité :

- "Cette action est définitive. Confirme-tu ?"
- "Tu vas perdre {N} {ressource}. C'est volontaire ?"
- "Annuler cette construction te fera perdre 50 % du coût engagé. Continuer ?"

## Anti-patterns

| ❌ À éviter                                              | ✅ Préférer                                                       |
|---------------------------------------------------------|-------------------------------------------------------------------|
| "Oups ! Quelque chose s'est mal passé."                  | Code HTTP + phrase contextuelle (cf. tableau erreurs serveur)    |
| "Cliquez ici pour…"                                      | Verbe d'action direct ("Améliorer le bâtiment")                  |
| "Êtes-vous sûr ?"                                        | "Cette action est définitive. Confirme-tu ?"                     |
| Memes / références pop ("Hodor", "wololo", emoji 🤡)     | Anachronismes subtils ("scribes synchronisent avec le grand livre") |
| Humour sur une perte de progression                      | Ton sobre, factuel, propose un retour à l'action                 |
| Vouvoiement                                              | Tutoiement systématique                                           |
| Anglais ("Loading…", "Submit", "Cancel")                 | Français — toute l'UI est en FR                                  |

## Contribution

Quand tu ajoutes une nouvelle phrase UI :

1. Vérifie si un cas similaire est déjà couvert dans cette doc.
2. Si non, ajoute-le au catalogue ci-dessus.
3. Si l'enjeu est élevé (combat, suppression, conquête subie) : applique le tone sobre.
4. Cohérence > créativité : préfère un libellé déjà utilisé ailleurs à inventer une nouvelle formulation.
