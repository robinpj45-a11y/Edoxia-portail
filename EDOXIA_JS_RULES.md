# Règles de Design - Edoxia-JS (Journée Sportive)

Cette note est conservée dans le projet pour garantir la cohérence dans les futurs développements.

## Contrainte Principale d'Interface

1. **Espace Enseignant (`TeacherPage.jsx`)** : 
   - **Cible** : Ordinateurs de bureau (Desktop).
   - **Design** : Interface large, utilisation du drag & drop, vue globale des listes de classes et d'équipes.

2. **Toutes les autres pages (HubPage, MobileTeamsPage, AdminPage, etc.)** :
   - **Cible** : **Mobiles uniquement** (Mobile-first).
   - **Design** : 
     - Optimisation pour l'usage tactile (gros boutons, zones de clics larges).
     - Navigation en bas d'écran (Bottom Tab Bars) privilégiée.
     - Défilement vertical fluide, éviter le débordement horizontal.
     - Gestion des "safe areas" (encoches des smartphones).
     - Les grilles doivent s'adapter aux petits écrans (ex: pas de grilles de 5 colonnes sur mobile, utilisation de `grid-cols-2` ou `grid-cols-3` maximum).
     - Typographie lisible sans zoom.

*Note générée par l'assistant IA pour garder ce contexte en mémoire lors des prochaines itérations du code.*
