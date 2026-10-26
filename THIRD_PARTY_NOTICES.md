# Third-party word list attribution

Grindly incorporates the French and English word lists from [LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words), © Shutterstock and contributors, licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

Source files: `fr` and `en` from the upstream repository. The list is used as an additional username profanity filter. Grindly normalizes accents and separators for comparison. The upstream list is subjective and is not a complete or authoritative moderation policy.

The source lists have been incorporated into `backend/src/data/forbidden-username-words.json`.
