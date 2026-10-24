import type { ObjectiveTemplate } from "../services/taskService"

// Catalogue local de propositions : utilisable même si l'API ne contient que quelques modèles.
// Les identifiants négatifs distinguent ces modèles des templates enregistrés en base.
export const LOCAL_OBJECTIVE_CATALOG: ObjectiveTemplate[] = [
  { id: -1, title: "Boire de l’eau régulièrement", description: "Installe une routine d’hydratation simple et régulière.", category: "Santé & bien-être", emoji: "💧", suggested_days: 14, target_value: 14, target_unit: "jours" },
  { id: -2, title: "Stabiliser mon heure de coucher", description: "Garde une heure de coucher régulière pour améliorer ton rythme.", category: "Santé & bien-être", emoji: "🌙", suggested_days: 21, target_value: 21, target_unit: "nuits" },
  { id: -3, title: "Construire une routine du matin", description: "Prépare une routine courte, réaliste et agréable avant de commencer la journée.", category: "Santé & bien-être", emoji: "🌅", suggested_days: 21, target_value: 21, target_unit: "matins" },
  { id: -4, title: "Faire une pause respiration", description: "Prends quelques minutes pour ralentir et relâcher la tension.", category: "Santé & bien-être", emoji: "🌬️", suggested_days: 10, target_value: 10, target_unit: "séances" },
  { id: -5, title: "M’étirer chaque jour", description: "Ajoute une courte séance de mobilité à ta journée.", category: "Santé & bien-être", emoji: "🧘", suggested_days: 14, target_value: 14, target_unit: "séances" },

  { id: -6, title: "Faire 12 séances de sport", description: "Choisis une activité qui te plaît et avance séance après séance.", category: "Sport", emoji: "🏋️", suggested_days: 30, target_value: 12, target_unit: "séances" },
  { id: -7, title: "Marcher 50 000 pas", description: "Cumule tes pas sur plusieurs sorties sans chercher la perfection.", category: "Sport", emoji: "🚶", suggested_days: 14, target_value: 50000, target_unit: "pas" },
  { id: -8, title: "Reprendre la course progressivement", description: "Alterner course et marche pour installer une habitude durable.", category: "Sport", emoji: "🏃", suggested_days: 30, target_value: 8, target_unit: "sorties" },
  { id: -9, title: "Faire 10 séances de mobilité", description: "Travaille souplesse, équilibre et amplitude à ton rythme.", category: "Sport", emoji: "🤸", suggested_days: 21, target_value: 10, target_unit: "séances" },
  { id: -10, title: "Tester une nouvelle activité sportive", description: "Découvre une activité et décide si tu veux la garder dans ta routine.", category: "Sport", emoji: "🥋", suggested_days: 30, target_value: 3, target_unit: "essais" },

  { id: -11, title: "Réviser avec régularité", description: "Planifie de courtes séances de révision et coche chaque session terminée.", category: "Études", emoji: "📚", suggested_days: 30, target_value: 20, target_unit: "séances" },
  { id: -12, title: "Cumuler 30 heures de révision", description: "Répartis tes révisions dans la semaine et suis le temps réellement consacré.", category: "Études", emoji: "⏳", suggested_days: 45, target_value: 30, target_unit: "heures" },
  { id: -13, title: "Terminer un cours en ligne", description: "Avance module après module jusqu’au dernier chapitre.", category: "Études", emoji: "🎓", suggested_days: 30, target_value: 10, target_unit: "modules" },
  { id: -14, title: "Valider une certification", description: "Prépare le programme, fais des examens blancs puis passe la certification.", category: "Études", emoji: "🏅", suggested_days: 60, target_value: 1, target_unit: "certification" },
  { id: -15, title: "Rattraper mes cours", description: "Liste les cours en retard et termine-les par petites étapes.", category: "Études", emoji: "📝", suggested_days: 21, target_value: 10, target_unit: "chapitres" },

  { id: -16, title: "Planifier ma journée", description: "Choisis chaque jour trois priorités réalistes avant de commencer.", category: "Productivité", emoji: "✅", suggested_days: 14, target_value: 14, target_unit: "jours" },
  { id: -17, title: "Faire 30 sessions de concentration", description: "Travaille sur une seule tâche à la fois, sans distractions.", category: "Productivité", emoji: "🎯", suggested_days: 30, target_value: 30, target_unit: "sessions" },
  { id: -18, title: "Réduire le temps sur mon téléphone", description: "Crée une plage sans téléphone pour protéger ton attention.", category: "Productivité", emoji: "📵", suggested_days: 14, target_value: 14, target_unit: "jours" },
  { id: -19, title: "Faire une revue hebdomadaire", description: "Chaque semaine, fais le point sur les progrès, les blocages et la suite.", category: "Productivité", emoji: "🗓️", suggested_days: 28, target_value: 4, target_unit: "revues" },
  { id: -20, title: "Vider ma boîte mail", description: "Trie, réponds, archive et désabonne-toi des messages inutiles.", category: "Productivité", emoji: "📨", suggested_days: 7, target_value: 5, target_unit: "sessions" },

  { id: -21, title: "Lire 8 livres", description: "Choisis des livres motivants et avance quelques pages à la fois.", category: "Lecture & culture", emoji: "📖", suggested_days: 90, target_value: 8, target_unit: "livres" },
  { id: -22, title: "Lire 20 chapitres", description: "Installe un moment de lecture régulier, même court.", category: "Lecture & culture", emoji: "🔖", suggested_days: 30, target_value: 20, target_unit: "chapitres" },
  { id: -23, title: "Découvrir 5 documentaires", description: "Explore de nouveaux sujets et note une idée retenue après chaque visionnage.", category: "Lecture & culture", emoji: "🎬", suggested_days: 30, target_value: 5, target_unit: "documentaires" },
  { id: -24, title: "Visiter 3 lieux culturels", description: "Prévois des sorties dans des musées, expositions ou lieux historiques.", category: "Lecture & culture", emoji: "🏛️", suggested_days: 60, target_value: 3, target_unit: "visites" },

  { id: -25, title: "Apprendre 100 nouveaux mots", description: "Mémorise du vocabulaire et révise les mots déjà appris.", category: "Langues", emoji: "🌍", suggested_days: 30, target_value: 100, target_unit: "mots" },
  { id: -26, title: "Pratiquer une langue 20 fois", description: "Alterne écoute, lecture, conversation et exercices courts.", category: "Langues", emoji: "🗣️", suggested_days: 30, target_value: 20, target_unit: "séances" },
  { id: -27, title: "Écouter 30 contenus dans une langue cible", description: "Utilise podcasts, vidéos ou chansons pour entraîner ton oreille.", category: "Langues", emoji: "🎧", suggested_days: 30, target_value: 30, target_unit: "écoutes" },
  { id: -28, title: "Tenir 4 conversations", description: "Pratique avec une personne, un groupe ou un partenaire linguistique.", category: "Langues", emoji: "💬", suggested_days: 45, target_value: 4, target_unit: "conversations" },

  { id: -29, title: "Suivre mes dépenses pendant 30 jours", description: "Note les dépenses pour mieux comprendre où part ton argent.", category: "Finances", emoji: "💳", suggested_days: 30, target_value: 30, target_unit: "jours" },
  { id: -30, title: "Épargner 200 €", description: "Fixe un montant réaliste et suis chaque contribution à ton épargne.", category: "Finances", emoji: "🐷", suggested_days: 60, target_value: 200, target_unit: "€" },
  { id: -31, title: "Préparer 4 budgets hebdomadaires", description: "Anticipe les dépenses importantes et fixe des limites par catégorie.", category: "Finances", emoji: "📊", suggested_days: 28, target_value: 4, target_unit: "budgets" },
  { id: -32, title: "Faire une pause avant chaque achat impulsif", description: "Attends 24 heures avant un achat non essentiel pour vérifier s’il est utile.", category: "Finances", emoji: "🛍️", suggested_days: 21, target_value: 21, target_unit: "jours" },

  { id: -33, title: "Tenir un journal 14 jours", description: "Écris quelques lignes pour faire le point sur tes pensées et tes journées.", category: "Développement personnel", emoji: "📓", suggested_days: 14, target_value: 14, target_unit: "entrées" },
  { id: -34, title: "Construire ma confiance en moi", description: "Note chaque semaine les petites actions qui t’ont demandé du courage.", category: "Développement personnel", emoji: "🦋", suggested_days: 30, target_value: 12, target_unit: "actions" },
  { id: -35, title: "Apprendre à dire non", description: "Repère les situations où tu dépasses tes limites et formule une réponse claire.", category: "Développement personnel", emoji: "🛡️", suggested_days: 30, target_value: 8, target_unit: "situations" },
  { id: -36, title: "Célébrer mes petites victoires", description: "Consigne les progrès, même modestes, pour les rendre visibles.", category: "Développement personnel", emoji: "✨", suggested_days: 21, target_value: 21, target_unit: "victoires" },

  { id: -37, title: "Écrire 1 000 mots", description: "Écris régulièrement sans chercher à perfectionner chaque phrase dès le début.", category: "Créativité", emoji: "✍️", suggested_days: 30, target_value: 1000, target_unit: "mots" },
  { id: -38, title: "Dessiner 15 fois", description: "Fais un croquis par session et observe ton évolution.", category: "Créativité", emoji: "🎨", suggested_days: 30, target_value: 15, target_unit: "dessins" },
  { id: -39, title: "Pratiquer un instrument 12 fois", description: "Travaille un passage ou un exercice précis à chaque séance.", category: "Créativité", emoji: "🎸", suggested_days: 30, target_value: 12, target_unit: "séances" },
  { id: -40, title: "Créer un mini-projet créatif", description: "Réalise un petit projet de A à Z et partage ou archive le résultat.", category: "Créativité", emoji: "🧵", suggested_days: 30, target_value: 5, target_unit: "étapes" },

  { id: -41, title: "Désencombrer 30 objets", description: "Donne, recycle ou range les objets qui n’ont plus leur place chez toi.", category: "Vie quotidienne", emoji: "🧺", suggested_days: 14, target_value: 30, target_unit: "objets" },
  { id: -42, title: "Ranger 10 espaces", description: "Choisis un tiroir, une étagère ou un dossier à la fois.", category: "Vie quotidienne", emoji: "🧹", suggested_days: 21, target_value: 10, target_unit: "espaces" },
  { id: -43, title: "Planifier mes repas chaque semaine", description: "Prévois des repas simples et une liste de courses adaptée.", category: "Vie quotidienne", emoji: "🍽️", suggested_days: 28, target_value: 4, target_unit: "semaines" },
  { id: -44, title: "Traiter les papiers en attente", description: "Regroupe les démarches et termine-les une par une.", category: "Vie quotidienne", emoji: "📁", suggested_days: 21, target_value: 10, target_unit: "démarches" },

  { id: -45, title: "Prendre des nouvelles de mes proches", description: "Envoie un message ou appelle les personnes avec qui tu veux garder le lien.", category: "Relations", emoji: "💌", suggested_days: 30, target_value: 8, target_unit: "contacts" },
  { id: -46, title: "Organiser 4 moments avec mes proches", description: "Prévois des temps de qualité, même simples, avec les personnes importantes.", category: "Relations", emoji: "☕", suggested_days: 45, target_value: 4, target_unit: "moments" },
  { id: -47, title: "Exprimer ma gratitude", description: "Remercie sincèrement quelqu’un ou note ce que tu apprécies dans ta journée.", category: "Relations", emoji: "💛", suggested_days: 14, target_value: 14, target_unit: "jours" },

  { id: -48, title: "Coder 10 sessions", description: "Travaille sur un petit projet et consigne ce que tu apprends à chaque session.", category: "Numérique", emoji: "💻", suggested_days: 30, target_value: 10, target_unit: "sessions" },
  { id: -49, title: "Réaliser 5 labs de cybersécurité", description: "Entraîne-toi dans des environnements autorisés et documente tes résultats.", category: "Numérique", emoji: "🛡️", suggested_days: 30, target_value: 5, target_unit: "labs" },
  { id: -50, title: "Construire mon portfolio", description: "Sélectionne tes projets, rédige leur présentation et publie une première version.", category: "Numérique", emoji: "🧩", suggested_days: 45, target_value: 6, target_unit: "étapes" },
]
