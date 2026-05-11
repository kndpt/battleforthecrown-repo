# Jeu stratégie multijoueur

_Started 2026-05-11 16:37 UTC_

---

## User

Selon toi, et ton expérience sur les jeux comme celui-ci (tribal wars/ kingsage/ travian/ clash of clan) quels autres composants doivent être impérativement fait ??
J'aimerai continuer à compléter le design system

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: list_files]_

_[tool: list_files]_

Excellente question — j'ai parcouru ton design system et tu as déjà une base très solide (boutons, cartes, badges, header, bottom nav, HUD ressources). Voici ce qui manque, classé par priorité d'usage dans un jeu comme Tribal Wars / Kingsage / Travian / Clash :

## 🔥 Indispensables — utilisés sur quasi tous les écrans

**Boucles de jeu fondamentales**
- **Build/Recruit Queue Card** — la file de construction (1-5 slots) avec sprite + nom + barre de progression + compte à rebours + bouton "Accélérer (10 🪙)" / "Annuler". C'est LE composant signature de ce genre de jeu.
- **Timer / Countdown** — composant atomique (`2:15`, `1h 30m`, `45s`) avec icône horloge, à intégrer partout (queue, mouvements, boosts).
- **Cost Row / Cost Pill** — la ligne "200 🪵 · 150 🪨 · 80 ⛏️ · 5 👥" avec chaque coût rouge si insuffisant, vert/normal si OK. Apparait sur chaque modal de construction/recrutement.
- **Requirement / Lock Chip** — "Château niv. 5 requis", "Caserne niv. 3 requise". État verrouillé vs débloqué.
- **Tooltip / Long-press popover** — explication d'un sprite, d'une stat, d'une icône. Mobile = long-press, desktop = hover.

**Feedback système**
- **Toast / Snackbar** — "Construction terminée", "Ressources insuffisantes" (déjà partiellement mentionné dans le README, à formaliser).
- **Modal variants** — confirm (neutre/danger/success), alert, achievement unlock. Tu as la signature visuelle mais pas la matrice de variantes.
- **Empty state** — la citation médiévale + sprite gris. Réutilisable rapport/inbox/quête.
- **Loading skeleton** — shimmer sur cards/lignes (l'animation existe déjà, manque le composant).

## ⚔️ Spécifiques au genre conquête

**Militaire & combat**
- **Troop Row** — portrait + nom + quantité possédée / en caserne + stats (atk/def/vitesse/capacité de pillage). Cœur des écrans Caserne/Atelier/Forge.
- **Troop Stepper / Selector** — "+1 / +10 / +100 / max" pour composer une armée. Critique — c'est l'interaction la plus utilisée en attaque.
- **Combat Report Card** — VICTOIRE/DÉFAITE en gros, attaquant vs défenseur, pertes des deux côtés, butin ramené. Format compact pour l'inbox + format détaillé.
- **Spy / Scout Report** — version "info révélée" du combat report (ressources vues, troupes vues, défenses).
- **Army Movement Bar** — "⚔️ Attaque → Village_X · arrive dans 2:15 · [Rappeler]". Liste persistante.
- **Power Comparison** — barre horizontale ⚔️ vs 🛡️ pour preview d'attaque.

**Carte & monde**
- **Coordinate Input** — `234 | 612` avec validation, bouton "Aller".
- **Map Tile / Village Marker** — pin de village (à toi, allié, ennemi, barbare) avec halo de couleur.
- **Mini-map / Radar** — vue compressée pour situer.

**Social & méta-jeu**
- **Player Profile Card** — avatar + nom + points + tribu + couronnes. Compact (liste) et étendu (modal).
- **Alliance / Tribe Banner** — emblème + tag `[BFC]` + nom. Petite version inline + grande version page.
- **Leaderboard Row** — rang + delta (▲3/▼1) + nom + points + tribu. Avec top 3 stylé (or/argent/bronze).
- **Mail / Inbox Item** — expéditeur + sujet + extrait + état lu/non-lu + heure. Trois types: rapport, message joueur, système.
- **Chat Bubble** — alliance chat. Joueur self vs autre + horodatage + emblème tribu.

## 💰 Économie & monétisation

- **Premium Bundle Card** — pack avec sprite + contenu détaillé + prix barré + bouton "Acheter". Touche un peu différente (or/violet pour premium).
- **Shop Item Tile** — grille d'items achetables (boosts, ressources, accélérations).
- **Daily Reward Grid** — 7 cases jour 1→7, case courante en surbrillance, cases passées validées.
- **Boost / Buff Pill** — effet actif avec timer ("+50% bois · 1h 23m").
- **Quest / Mission Card** — objectif + barre de progression "3/5" + récompense + bouton "Réclamer".
- **Achievement Tile** — sprite + titre + état (verrouillé gris / débloqué doré) + tier.

## 🧩 Atomiques manquants

- **Segmented control / Tab bar** — pour switcher entre sous-sections (Caserne / Atelier / Forge dans le même écran).
- **Slider** — pour répartition de troupes, opacités, etc.
- **Stepper numérique** — − / valeur / + (réutilisé partout : troupes, marché, etc).
- **Avatar** — rond avec bordure 2px, états (online, en attaque, en défense).
- **Star / Pip rating** — niveau du bâtiment en pips dorés (●●●○○ niv 3/5).
- **Divider** — séparateur ornemental cohérent avec le côté médiéval (filet doré + losange central).
- **Banner / Page Title** — le bandeau en bois (`assets/ui/banner.png`) formalisé en composant avec slot de texte.

## 📋 Ma recommandation d'ordre

Si je devais prioriser pour le prochain batch :

1. **Build/Recruit Queue Card** + **Timer** + **Cost Row** (la boucle core)
2. **Tooltip** + **Toast** + **Modal variants** (feedback)
3. **Troop Row** + **Troop Stepper** + **Combat Report** (militaire)
4. **Player Profile Card** + **Alliance Banner** + **Leaderboard Row** (social)
5. Le reste en finitions

Veux-tu que je commence par le **batch 1 (boucle core de jeu)** ? C'est ce qui débloque le plus d'écrans en cascade. Je peux les ajouter à `preview/` et `ui_kits/game/components.jsx` dans la foulée.

## User

Fait ce que tu peux jusqu'à ne plus pouvoir

## Assistant

_[tool: snip]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: snip]_

_[tool: snip]_

_[tool: update_todos]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: update_todos]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: update_todos]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: update_todos]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: update_todos]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: update_todos]_

_[tool: read_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: show_to_user]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: update_todos]_

_[tool: snip]_

_[tool: register_assets]_

_[tool: snip]_

_[tool: update_todos]_

_[tool: done]_

_[tool: fork_verifier_agent]_

6 nouveaux lots livrés (Méta/économie + Atomiques) — quête, achievement, daily reward, boosts, premium bundles, shop, segmented, stepper, avatar, pips, divider, banner title, coord input, map marker. La bannière de tribu a été revue côté héraldique (écus quartelés / chevron / croix, pennon, profil de tribu, tags inline, liste diplomatique).

## User

Regenerate "Map marker / pin": ok j'adore mais j'aimerai l'améliorer. En effet, remplacer les triangles par un emoji de troupe ou de sword. 
Egalement, on a un système de Tier pour les villages barbares (donc 1 à 5), je voudrais une étoile avec un chiffre dedans (de 1 à 5) pour se rendre compte directement du T juste sur la map. 

Egalement, les pins ne vont pas exister, par contre on peut reprendre le gros rond avec icon dedans pour représenter justement les villages/entités barbares, et les villages ennemies/alliés d'autres joueurs.
Rouge pour barbare, bleu pour alliés, etc.

## Assistant

_[tool: snip]_

_[tool: write_file]_

_[tool: show_to_user]_

_[tool: snip]_

Voilà — pins teardrop supprimés, marqueurs unifiés en gros rond à icône avec teintes (vous/tribu/allié/NAP/ennemi/barbare/ruine), étoile T1→T5 sur les barbares (T5 anime en pulsation rouge), et les marches utilisent maintenant une icône épée/templier/bouclier au lieu du triangle.

