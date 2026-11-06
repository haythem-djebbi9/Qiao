# Traduction du site (EN, ZH, AR)

Le français du code et de la base reste la seule source. `src/i18n/runtime.ts` remplace les textes affichés, sans recharger la page.

| Contenu | Traduit par |
|---|---|
| Interface, catalogue de départ, messages de l'API | Dictionnaires `public/i18n/<langue>.json`, générés ici et versionnés |
| Contenus publiés ensuite par l'administration | Le serveur, avec Gemini (`Backend/src/modules/i18n`) ; il faut `GEMINI_API_KEY` en production |
| Noms de membres, publications, messages | Rien : ils s'affichent tels qu'ils ont été écrits |
| Logo, noms des langues | Rien : ils portent `translate="no"` |

## Après avoir ajouté ou modifié des textes dans le code

```bash
cd Frontend
node scripts/i18n/extract.mjs
node scripts/i18n/translate.mjs
```

Seuls les nouveaux textes sont envoyés à Gemini. Committez ensuite `public/i18n/*.json`.

Pour écarter un texte de la traduction, ajoutez `translate="no"` à son élément.

## Contrôler une page

Dans la console du navigateur, sur une page affichée en EN, ZH ou AR :

```js
__qiaoI18nMisses()
```

Le résultat liste les textes restés sans traduction. Pour un texte composé à l'exécution, ajoutez-le à `extra-strings.json` (`{0}` pour une valeur variable), puis relancez les deux commandes.
