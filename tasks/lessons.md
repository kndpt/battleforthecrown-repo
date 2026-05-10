# Lessons

- Relire les leçons projet en début de session ; si le fichier n'existe pas, le créer avant de continuer.
- Ne pas attendre longtemps un sub-agent silencieux : faire un poll court, fermer l'agent bloqué, documenter la dérogation et reprendre avec une cartographie locale ciblée.
- Si une commande `rtk` en parallèle semble bloquer, stopper le fan-out et reprendre avec une seule commande ciblée, bornée en sortie.
- Pour déléguer à `implementer`, utiliser les labels exacts attendus (`Spec source`, `Fichiers à toucher`, `Changement attendu`, `Hors scope explicite`, `Critère de succès`) ; le contenu peut rester souple, mais le contrat doit être stable.
