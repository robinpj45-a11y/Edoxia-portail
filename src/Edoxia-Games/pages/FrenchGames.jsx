import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Volume2, VolumeX, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { collection, addDoc, query, orderBy, limit, getDocs, where, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { ThemeContext } from "../../ThemeContext";

// --- BANQUE DE QUESTIONS MASSIVE (Niveau CE2) ---
const questionsBank = [
  // --- IL (Masculin Singulier) ---
  { gn: "Le petit chat", rest: "dort sur le tapis.", answer: "Il" },
  { gn: "Mon père", rest: "lave la voiture.", answer: "Il" },
  { gn: "L'avion", rest: "traverse les nuages.", answer: "Il" },
  { gn: "Ce garçon", rest: "court très vite.", answer: "Il" },
  { gn: "Le boulanger", rest: "cuit du pain frais.", answer: "Il" },
  { gn: "Mon stylo bleu", rest: "est dans la trousse.", answer: "Il" },
  { gn: "Le soleil", rest: "brille fort aujourd'hui.", answer: "Il" },
  { gn: "Ton frère", rest: "regarde un dessin animé.", answer: "Il" },
  { gn: "Le lion", rest: "est le roi de la savane.", answer: "Il" },
  { gn: "Ce livre", rest: "raconte une belle histoire.", answer: "Il" },
  { gn: "Le train", rest: "entre en gare.", answer: "Il" },
  { gn: "Mon oncle", rest: "habite à Paris.", answer: "Il" },
  { gn: "Le directeur", rest: "parle aux élèves.", answer: "Il" },
  { gn: "L'ordinateur", rest: "est allumé.", answer: "Il" },
  { gn: "Le ballon", rest: "roule dans l'herbe.", answer: "Il" },
  { gn: "Un oiseau", rest: "chante sur la branche.", answer: "Il" },
  { gn: "Le jardinier", rest: "arrose les fleurs.", answer: "Il" },
  { gn: "Ce gâteau", rest: "sent le chocolat.", answer: "Il" },
  { gn: "Le vent", rest: "souffle dans les arbres.", answer: "Il" },
  { gn: "Mon ami Paul", rest: "vient jouer demain.", answer: "Il" },
  { gn: "Le facteur", rest: "apporte le courrier.", answer: "Il" },
  { gn: "Ce château", rest: "est très ancien.", answer: "Il" },
  { gn: "Le cheval", rest: "galope dans le pré.", answer: "Il" },
  { gn: "Mon cartable", rest: "est trop lourd.", answer: "Il" },
  { gn: "Le tableau", rest: "est rempli de craie.", answer: "Il" },
  { gn: "L'éléphant", rest: "a une longue trompe.", answer: "Il" },
  { gn: "Le policier", rest: "arrête la circulation.", answer: "Il" },
  { gn: "Ce manteau", rest: "est bien chaud.", answer: "Il" },
  { gn: "Le ciel", rest: "devient tout gris.", answer: "Il" },
  { gn: "Mon lit", rest: "est très confortable.", answer: "Il" },

  // --- ELLE (Féminin Singulier) ---
  { gn: "La petite fille", rest: "saute à la corde.", answer: "Elle" },
  { gn: "Ma maîtresse", rest: "nous lit un conte.", answer: "Elle" },
  { gn: "Une belle fleur", rest: "pousse dans le pot.", answer: "Elle" },
  { gn: "La voiture rouge", rest: "démarre doucement.", answer: "Elle" },
  { gn: "Ta gomme", rest: "efface très bien.", answer: "Elle" },
  { gn: "La lune", rest: "éclaire la nuit.", answer: "Elle" },
  { gn: "Ma mère", rest: "travaille au bureau.", answer: "Elle" },
  { gn: "Cette table", rest: "est mise pour le dîner.", answer: "Elle" },
  { gn: "La pluie", rest: "tombe depuis ce matin.", answer: "Elle" },
  { gn: "La girafe", rest: "mange des feuilles.", answer: "Elle" },
  { gn: "Une pomme", rest: "est tombée de l'arbre.", answer: "Elle" },
  { gn: "Ma soeur", rest: "fait ses devoirs.", answer: "Elle" },
  { gn: "La musique", rest: "est trop forte.", answer: "Elle" },
  { gn: "Cette maison", rest: "a des volets bleus.", answer: "Elle" },
  { gn: "La boulangère", rest: "vend des croissants.", answer: "Elle" },
  { gn: "La télévision", rest: "est éteinte.", answer: "Elle" },
  { gn: "Une abeille", rest: "vole vers la ruche.", answer: "Elle" },
  { gn: "La mer", rest: "est calme aujourd'hui.", answer: "Elle" },
  { gn: "Ma voisine", rest: "promène son chien.", answer: "Elle" },
  { gn: "La lampe", rest: "éclaire le salon.", answer: "Elle" },
  { gn: "Cette chaise", rest: "est cassée.", answer: "Elle" },
  { gn: "La rivière", rest: "coule sous le pont.", answer: "Elle" },
  { gn: "Une souris", rest: "se cache dans le trou.", answer: "Elle" },
  { gn: "La cantine", rest: "sert des frites.", answer: "Elle" },
  { gn: "Ma tante", rest: "m'a offert un cadeau.", answer: "Elle" },
  { gn: "La fenêtre", rest: "est ouverte.", answer: "Elle" },
  { gn: "Cette règle", rest: "mesure trente centimètres.", answer: "Elle" },
  { gn: "La neige", rest: "recouvre la route.", answer: "Elle" },
  { gn: "Une étoile", rest: "file dans le ciel.", answer: "Elle" },
  { gn: "La porte", rest: "grince un peu.", answer: "Elle" },

  // --- ILS (Masculin Pluriel) ---
  { gn: "Les enfants", rest: "jouent au ballon.", answer: "Ils" },
  { gn: "Mes cousins", rest: "arrivent ce soir.", answer: "Ils" },
  { gn: "Les oiseaux", rest: "s'envolent vers le sud.", answer: "Ils" },
  { gn: "Les tigres", rest: "sont dans la cage.", answer: "Ils" },
  { gn: "Paul et Marc", rest: "sont meilleurs amis.", answer: "Ils" },
  { gn: "Les nuages", rest: "cachent le soleil.", answer: "Ils" },
  { gn: "Mes stylos", rest: "ne marchent plus.", answer: "Ils" },
  { gn: "Les pompiers", rest: "éteignent le feu.", answer: "Ils" },
  { gn: "Des loups", rest: "hurlent dans la forêt.", answer: "Ils" },
  { gn: "Ton père et ton frère", rest: "lavent le garage.", answer: "Ils" },
  { gn: "Les avions", rest: "décollent de la piste.", answer: "Ils" },
  { gn: "Ces gâteaux", rest: "sont délicieux.", answer: "Ils" },
  { gn: "Les élèves", rest: "écoutent la leçon.", answer: "Ils" },
  { gn: "Mon chien et mon chat", rest: "dorment ensemble.", answer: "Ils" },
  { gn: "Les arbres", rest: "perdent leurs feuilles.", answer: "Ils" },
  { gn: "Mes amis", rest: "organisent une fête.", answer: "Ils" },
  { gn: "Les joueurs", rest: "entrent sur le terrain.", answer: "Ils" },
  { gn: "Ces livres", rest: "sont à la bibliothèque.", answer: "Ils" },
  { gn: "Les poissons", rest: "nagent dans l'eau.", answer: "Ils" },
  { gn: "Lucas et son papa", rest: "vont à la pêche.", answer: "Ils" },
  { gn: "Les magasins", rest: "ferment à 19h.", answer: "Ils" },
  { gn: "Tes cheveux", rest: "sont bien coiffés.", answer: "Ils" },
  { gn: "Les camions", rest: "transportent des marchandises.", answer: "Ils" },
  { gn: "Les devoirs", rest: "sont difficiles.", answer: "Ils" },
  { gn: "Ces bonbons", rest: "sont trop sucrés.", answer: "Ils" },
  { gn: "Le garçon et la fille", rest: "rentrent de l'école.", answer: "Ils" },
  { gn: "Les médecins", rest: "soignent les malades.", answer: "Ils" },
  { gn: "Les voisins", rest: "font du bruit.", answer: "Ils" },
  { gn: "Les ordinateurs", rest: "sont en panne.", answer: "Ils" },
  { gn: "Des cailloux", rest: "gênent le passage.", answer: "Ils" },

  // --- ELLES (Féminin Pluriel) ---
  { gn: "Les filles", rest: "dansent sur la piste.", answer: "Elles" },
  { gn: "Mes chaussures", rest: "sont toutes neuves.", answer: "Elles" },
  { gn: "Les pommes", rest: "sont bien mûres.", answer: "Elles" },
  { gn: "Julie et Sophie", rest: "révisent leurs leçons.", answer: "Elles" },
  { gn: "Des étoiles", rest: "brillent ce soir.", answer: "Elles" },
  { gn: "Les vaches", rest: "broutent dans le pré.", answer: "Elles" },
  { gn: "Mes tantes", rest: "habitent à Lyon.", answer: "Elles" },
  { gn: "Les fleurs", rest: "sentent très bon.", answer: "Elles" },
  { gn: "Ces maisons", rest: "sont en briques.", answer: "Elles" },
  { gn: "Les voitures", rest: "klaxonnent dans la rue.", answer: "Elles" },
  { gn: "La mère et la fille", rest: "font un gâteau.", answer: "Elles" },
  { gn: "Les poules", rest: "pondent des oeufs.", answer: "Elles" },
  { gn: "Tes chaussettes", rest: "sont dépareillées.", answer: "Elles" },
  { gn: "Les tables", rest: "sont propres.", answer: "Elles" },
  { gn: "Les feuilles", rest: "tombent en automne.", answer: "Elles" },
  { gn: "Mes copines", rest: "m'ont invité.", answer: "Elles" },
  { gn: "Les fourmis", rest: "travaillent dur.", answer: "Elles" },
  { gn: "Les montagnes", rest: "sont couvertes de neige.", answer: "Elles" },
  { gn: "Ces images", rest: "sont magnifiques.", answer: "Elles" },
  { gn: "Léa et sa maman", rest: "lisent un livre.", answer: "Elles" },
  { gn: "Les fenêtres", rest: "sont fermées.", answer: "Elles" },
  { gn: "Les vacances", rest: "passent trop vite.", answer: "Elles" },
  { gn: "Mes lunettes", rest: "sont sur mon nez.", answer: "Elles" },
  { gn: "Les girafes", rest: "ont un long cou.", answer: "Elles" },
  { gn: "Ces couleurs", rest: "sont vives.", answer: "Elles" },
  { gn: "Les glaces", rest: "fondent au soleil.", answer: "Elles" },
  { gn: "Les bouteilles", rest: "sont vides.", answer: "Elles" },
  { gn: "Marie et Claire", rest: "sont jumelles.", answer: "Elles" },
  { gn: "Les lumières", rest: "s'allument.", answer: "Elles" },
  { gn: "Les dents", rest: "doivent être brossées.", answer: "Elles" },

  // --- NOUS (Moi + ...) ---
  { gn: "Mon frère et moi", rest: "regardons un film.", answer: "Nous" },
  { gn: "Toi et moi", rest: "sommes une équipe.", answer: "Nous" },
  { gn: "Mes parents et moi", rest: "allons à la plage.", answer: "Nous" },
  { gn: "Le chien et moi", rest: "courons vite.", answer: "Nous" },
  { gn: "Paul et moi", rest: "sommes dans la même classe.", answer: "Nous" },
  { gn: "Ma soeur et moi", rest: "partageons la chambre.", answer: "Nous" },
  { gn: "Les élèves et moi", rest: "sortons en récréation.", answer: "Nous" },
  { gn: "Mon papi et moi", rest: "jouons aux cartes.", answer: "Nous" },
  { gn: "Toi et moi", rest: "aimons les glaces.", answer: "Nous" },
  { gn: "Julie et moi", rest: "faisons du vélo.", answer: "Nous" },
  { gn: "Mon chat et moi", rest: "faisons la sieste.", answer: "Nous" },
  { gn: "Mes amis et moi", rest: "préparons un spectacle.", answer: "Nous" },
  { gn: "Le maître et moi", rest: "discutons du devoir.", answer: "Nous" },
  { gn: "Ta mère et moi", rest: "buvons du café.", answer: "Nous" },
  { gn: "Léo et moi", rest: "sommes voisins.", answer: "Nous" },
  { gn: "Ma cousine et moi", rest: "chantons une chanson.", answer: "Nous" },
  { gn: "Les joueurs et moi", rest: "fêtons la victoire.", answer: "Nous" },
  { gn: "Ton père et moi", rest: "réparons le vélo.", answer: "Nous" },
  { gn: "Sarah et moi", rest: "écrivons une lettre.", answer: "Nous" },
  { gn: "Le groupe et moi", rest: "visitons le musée.", answer: "Nous" },
  { gn: "Mes frères et moi", rest: "aidons maman.", answer: "Nous" },
  { gn: "Toi et moi", rest: "irons au parc.", answer: "Nous" },
  { gn: "Lucas et moi", rest: "échangeons des billes.", answer: "Nous" },
  { gn: "La classe et moi", rest: "prenons le bus.", answer: "Nous" },
  { gn: "Mon oncle et moi", rest: "pêchons au lac.", answer: "Nous" },
  { gn: "Sophie et moi", rest: "dessinons des chats.", answer: "Nous" },
  { gn: "Les voisins et moi", rest: "organisons un repas.", answer: "Nous" },
  { gn: "Mon équipe et moi", rest: "avons gagné.", answer: "Nous" },
  { gn: "Toi et moi", rest: "restons ici.", answer: "Nous" },
  { gn: "Ma famille et moi", rest: "déménageons bientôt.", answer: "Nous" },

  // --- VOUS (Toi + ...) ---
  { gn: "Ta sœur et toi", rest: "préparez le goûter.", answer: "Vous" },
  { gn: "Ton copain et toi", rest: "jouez aux jeux vidéo.", answer: "Vous" },
  { gn: "Les élèves et toi", rest: "écoutez le directeur.", answer: "Vous" },
  { gn: "Maman et toi", rest: "allez faire les courses.", answer: "Vous" },
  { gn: "Paul et toi", rest: "êtes en retard.", answer: "Vous" },
  { gn: "Tes parents et toi", rest: "partez en voyage.", answer: "Vous" },
  { gn: "Le chien et toi", rest: "faites trop de bruit.", answer: "Vous" },
  { gn: "Julie et toi", rest: "savez bien danser.", answer: "Vous" },
  { gn: "Ton frère et toi", rest: "devez ranger la chambre.", answer: "Vous" },
  { gn: "Léa et toi", rest: "êtes invitées.", answer: "Vous" },
  { gn: "Les voisins et toi", rest: "nettoyez la rue.", answer: "Vous" },
  { gn: "Ton père et toi", rest: "regardez le match.", answer: "Vous" },
  { gn: "Marc et toi", rest: "avez fini l'exercice.", answer: "Vous" },
  { gn: "Tes amis et toi", rest: "venez à la maison.", answer: "Vous" },
  { gn: "La classe et toi", rest: "préparez la fête.", answer: "Vous" },
  { gn: "Sophie et toi", rest: "portez la même robe.", answer: "Vous" },
  { gn: "Mon frère et toi", rest: "vous disputez souvent.", answer: "Vous" },
  { gn: "Le chat et toi", rest: "dormez tout le temps.", answer: "Vous" },
  { gn: "Tes cousines et toi", rest: "chantez bien.", answer: "Vous" },
  { gn: "Pierre et toi", rest: "êtes les plus grands.", answer: "Vous" },
  { gn: "Le maître et toi", rest: "corrigez le tableau.", answer: "Vous" },
  { gn: "Ta grand-mère et toi", rest: "faites du tricot.", answer: "Vous" },
  { gn: "Lucas et toi", rest: "courez vite.", answer: "Vous" },
  { gn: "Les filles et toi", rest: "jouez à la marelle.", answer: "Vous" },
  { gn: "Ton oncle et toi", rest: "lavez la voiture.", answer: "Vous" },
  { gn: "Marie et toi", rest: "aimez le chocolat.", answer: "Vous" },
  { gn: "Les garçons et toi", rest: "jouez au foot.", answer: "Vous" },
  { gn: "Ta meilleure amie et toi", rest: "rigolez tout le temps.", answer: "Vous" },
  { gn: "Le groupe et toi", rest: "présentez l'exposé.", answer: "Vous" },
  { gn: "Tes parents et toi", rest: "habitez ici.", answer: "Vous" },
];

// --- BANQUE DE CONJUGAISON (Présent - 1er Groupe) ---
const conjugaisonPresent1Bank = [
  { sentence: "Le petit chat mang...", rest: " sur son tapis.", answer: "e", full: "Le petit chat mange sur son tapis." },
  { sentence: "Tu aim...", rest: " beaucoup les cerises.", answer: "es", full: "Tu aimes beaucoup les cerises." },
  { sentence: "Nous regard...", rest: " les nuages passer.", answer: "ons", full: "Nous regardons les nuages passer." },
  { sentence: "Vous dessin...", rest: " un beau paysage.", answer: "ez", full: "Vous dessinez un beau paysage." },
  { sentence: "Les oiseaux chant...", rest: " dès l'aube.", answer: "ent", full: "Les oiseaux chantent dès l'aube." },
  { sentence: "Je port...", rest: " mon nouveau cartable.", answer: "e", full: "Je porte mon nouveau cartable." },
  { sentence: "Paul et moi jou...", rest: " ensemble.", answer: "ons", full: "Paul et moi jouons ensemble." },
  { sentence: "Maman prépar...", rest: " une tarte aux pommes.", answer: "e", full: "Maman prépare une tarte aux pommes." },
  { sentence: "Toi et ton ami écout...", rest: " la musique.", answer: "ez", full: "Toi et ton ami écoutez la musique." },
  { sentence: "Le vent souffl...", rest: " très fort.", answer: "e", full: "Le vent souffle très fort." },
  { sentence: "Les enfants saut...", rest: " dans les flaques.", answer: "ent", full: "Les enfants sautent dans les flaques." },
  { sentence: "Tu color...", rest: " proprement ton dessin.", answer: "es", full: "Tu colories proprement ton dessin." },
  { sentence: "Mon frère et moi lav...", rest: " le vélo.", answer: "ons", full: "Mon frère et moi lavons le vélo." },
  { sentence: "Les étoiles brill...", rest: " dans le ciel.", answer: "ent", full: "Les étoiles brillent dans le ciel." },
  { sentence: "Vous mang...", rest: " trop vite votre goûter.", answer: "ez", full: "Vous mangez trop vite votre goûter." },
  { sentence: "Je march...", rest: " doucement dans la forêt.", answer: "e", full: "Je marche doucement dans la forêt." },
  { sentence: "Les voitures roul...", rest: " sur l'autoroute.", answer: "ent", full: "Les voitures roulent sur l'autoroute." },
  { sentence: "Tu cherch...", rest: " tes clés partout.", answer: "es", full: "Tu cherches tes clés partout." },
  { sentence: "Nous rang...", rest: " nos affaires.", answer: "ons", full: "Nous rangeons nos affaires." },
  { sentence: "Ma sœur dans...", rest: " magnifiquement.", answer: "e", full: "Ma sœur danse magnifiquement." },
  { sentence: "Papa travaill...", rest: " beaucoup aujourd'hui.", answer: "e", full: "Papa travaille beaucoup aujourd'hui." },
  { sentence: "Vous parl...", rest: " trop fort dans la classe.", answer: "ez", full: "Vous parlez trop fort dans la classe." },
  { sentence: "Les avions travers...", rest: " l'océan.", answer: "ent", full: "Les avions traversent l'océan." },
  { sentence: "Je découp...", rest: " des formes en papier.", answer: "e", full: "Je découpe des formes en papier." },
  { sentence: "Tu racont...", rest: " une histoire drôle.", answer: "es", full: "Tu racontes une histoire drôle." },
  { sentence: "Les lions chass...", rest: " dans la savane.", answer: "ent", full: "Les lions chassent dans la savane." },
  { sentence: "Nous saut...", rest: " à la corde à sauter.", answer: "ons", full: "Nous sautons à la corde à sauter." },
  { sentence: "Les élèves écout...", rest: " la maîtresse.", answer: "ent", full: "Les élèves écoutent la maîtresse." },
  { sentence: "Vous march...", rest: " sur le trottoir.", answer: "ez", full: "Vous marchez sur le trottoir." },
  { sentence: "Elle pleur...", rest: " car elle a perdu son doudou.", answer: "e", full: "Elle pleure car elle a perdu son doudou." },
  { sentence: "Tu nag...", rest: " comme un petit poisson.", answer: "es", full: "Tu nages comme un petit poisson." },
  { sentence: "Mes parents habit...", rest: " une grande maison.", answer: "ent", full: "Mes parents habitent une grande maison." },
  { sentence: "Nous visit...", rest: " le zoo de la ville.", answer: "ons", full: "Nous visitons le zoo de la ville." },
  { sentence: "Je ferm...", rest: " la porte à clé.", answer: "e", full: "Je ferme la porte à clé." },
  { sentence: "Vous pens...", rest: " déjà aux vacances.", answer: "ez", full: "Vous pensez déjà aux vacances." },
  { sentence: "Les fourmis rapport...", rest: " de la nourriture.", answer: "ent", full: "Les fourmis rapportent de la nourriture." },
  { sentence: "Tu cri...", rest: " trop fort dans le jardin.", answer: "es", full: "Tu cries trop fort dans le jardin." },
  { sentence: "Mon ami et moi partag...", rest: " nos billes.", answer: "ons", full: "Mon ami et moi partageons nos billes." },
  { sentence: "Le soleil chauff...", rest: " le sable.", answer: "e", full: "Le soleil chauffe le sable." },
  { sentence: "Les arbres pouss...", rest: " vers le ciel.", answer: "ent", full: "Les arbres poussent vers le ciel." },
  { sentence: "Vous entr...", rest: " sans faire de bruit.", answer: "ez", full: "Vous entrez sans faire de bruit." },
  { sentence: "Je gout...", rest: " au bon chocolat.", answer: "e", full: "Je goute au bon chocolat." },
  { sentence: "Tu port...", rest: " des lunettes roses.", answer: "es", full: "Tu portes des lunettes roses." },
  { sentence: "Nous lanc...", rest: " le ballon très loin.", answer: "ons", full: "Nous lançons le ballon très loin." },
  { sentence: "Les poissons bull...", rest: " dans l'aquarium.", answer: "ent", full: "Les poissons bullent dans l'aquarium." },
  { sentence: "Elle cherch...", rest: " son chemin dans le parc.", answer: "e", full: "Elle cherche son chemin dans le parc." },
  { sentence: "Vous arriv...", rest: " juste à temps.", answer: "ez", full: "Vous arrivez juste à temps." },
  { sentence: "Je rest...", rest: " calme malgré le bruit.", answer: "e", full: "Je reste calme malgré le bruit." },
  { sentence: "Tu oubli...", rest: " toujours ton parapluie.", answer: "es", full: "Tu oublies toujours ton parapluie." },
  { sentence: "Les éléphants march...", rest: " lentement.", answer: "ent", full: "Les éléphants marchent lentement." },
  { sentence: "Moi et mon frère nettoy...", rest: " la cour.", answer: "ons", full: "Moi et mon frère nettoyons la cour." },
  { sentence: "Vous trouv...", rest: " la réponse facilement.", answer: "ez", full: "Vous trouvez la réponse facilement." },
  { sentence: "Le chien gard...", rest: " la maison fidèlement.", answer: "e", full: "Le chien garde la maison fidèlement." },
  { sentence: "Les vaches brout...", rest: " l'herbe tendre.", answer: "ent", full: "Les vaches broutent l'herbe tendre." },
  { sentence: "Tu donn...", rest: " à manger aux poules.", answer: "es", full: "Tu donnes à manger aux poules." },
  { sentence: "Nous chant...", rest: " une chanson joyeuse.", answer: "ons", full: "Nous chantons une chanson joyeuse." },
  { sentence: "La pluie mouill...", rest: " les passants.", answer: "e", full: "La pluie mouille les passants." },
  { sentence: "Vous admir...", rest: " le coucher de soleil.", answer: "ez", full: "Vous admirez le coucher de soleil." },
  { sentence: "Je montr...", rest: " ma collection de timbres.", answer: "e", full: "Je montre ma collection de timbres." },
  { sentence: "Tu détest...", rest: " les épinards cuits.", answer: "es", full: "Tu détestes les épinards cuits." },
  { sentence: "Les pommes tomb...", rest: " de l'arbre.", answer: "ent", full: "Les pommes tombent de l'arbre." },
  { sentence: "Nous grimp...", rest: " tout en haut du mur.", answer: "ons", full: "Nous grimpons tout en haut du mur." },
  { sentence: "Elle réveil...", rest: " son petit frère.", answer: "e", full: "Elle réveille son petit frère." },
  { sentence: "Vous bross...", rest: " vos dents le soir.", answer: "ez", full: "Vous brossez vos dents le soir." },
  { sentence: "Je vérifi...", rest: " l'orthographe du mot.", answer: "e", full: "Je vérifie l'orthographe du mot." },
  { sentence: "Tu dessin...", rest: " un monstre rigolo.", answer: "es", full: "Tu dessines un monstre rigolo." },
  { sentence: "Les loups hurl...", rest: " sous la lune.", answer: "ent", full: "Les loups hurlent sous la lune." },
  { sentence: "Mon oncle et moi cuisin...", rest: " un gâteau.", answer: "ons", full: "Mon oncle et moi cuisinons un gâteau." },
  { sentence: "Le facteur pass...", rest: " tous les matins.", answer: "e", full: "Le facteur passe tous les matins." },
  { sentence: "Vous aid...", rest: " beaucoup vos parents.", answer: "ez", full: "Vous aidez beaucoup vos parents." },
  { sentence: "Je pens...", rest: " très fort à toi.", answer: "e", full: "Je pense très fort à toi." },
  { sentence: "Tu lach...", rest: " le fil du cerf-volant.", answer: "es", full: "Tu laches le fil du cerf-volant." },
  { sentence: "Les abeilles butin...", rest: " les fleurs.", answer: "ent", full: "Les abeilles butinent les fleurs." },
  { sentence: "Nous pli...", rest: " les vêtements propres.", answer: "ons", full: "Nous plions les vêtements propres." },
  { sentence: "La maîtresse racont...", rest: " un conte.", answer: "e", full: "La maîtresse raconte un conte." },
  { sentence: "Vous apport...", rest: " le dessert ce soir.", answer: "ez", full: "Vous apportez le dessert ce soir." },
  { sentence: "Je lav...", rest: " mes mains avant le repas.", answer: "e", full: "Je lave mes mains avant le repas." },
  { sentence: "Tu rigol...", rest: " de mes bêtises.", answer: "es", full: "Tu rigoles de mes bêtises." },
  { sentence: "Les voitures klaxonn...", rest: " bruyamment.", answer: "ent", full: "Les voitures klaxonnent bruyamment." },
  { sentence: "Nous espér...", rest: " gagner le match.", answer: "ons", full: "Nous espérons gagner le match." },
  { sentence: "Il éternu...", rest: " à cause du rhume.", answer: "e", full: "Il éternue à cause du rhume." },
  { sentence: "Vous travers...", rest: " dans les clous.", answer: "ez", full: "Vous traversez dans les clous." },
  { sentence: "Je prépar...", rest: " mon sac pour demain.", answer: "e", full: "Je prépare mon sac pour demain." },
  { sentence: "Tu téléphon...", rest: " à ta mamie.", answer: "es", full: "Tu téléphones à ta mamie." },
  { sentence: "Les vagues frapp...", rest: " le rocher.", answer: "ent", full: "Les vagues frappent le rocher." },
  { sentence: "Mon papa et moi jou...", rest: " au foot.", answer: "ons", full: "Mon papa et moi jouons au foot." },
  { sentence: "Vous mont...", rest: " l'escalier quatre par quatre.", answer: "ez", full: "Vous montez l'escalier quatre par quatre." },
  { sentence: "L'ordinateur chauff...", rest: " un petit peu.", answer: "e", full: "L'ordinateur chauffe un petit peu." },
  { sentence: "Les hirondelles quitt...", rest: " le pays.", answer: "ent", full: "Les hirondelles quittent le pays." },
  { sentence: "Tu frapp...", rest: " à la porte.", answer: "es", full: "Tu frappes à la porte." },
  { sentence: "Nous goût...", rest: " de nouveaux fruits.", answer: "ons", full: "Nous goûtons de nouveaux fruits." },
  { sentence: "Vous gard...", rest: " le secret pour vous.", answer: "ez", full: "Vous gardez le secret pour vous." },
  { sentence: "Je découp...", rest: " dans un vieux magazine.", answer: "e", full: "Je découpe dans un vieux magazine." },
  { sentence: "Tu rest...", rest: " là sans bouger.", answer: "es", full: "Tu restes là sans bouger." },
  { sentence: "Les lampes éclair...", rest: " toute la rue.", answer: "ent", full: "Les lampes éclairent toute la rue." },
  { sentence: "Nous ramass...", rest: " des coquillages.", answer: "ons", full: "Nous ramassons des coquillages." },
  { sentence: "Elle révis...", rest: " sa leçon de piano.", answer: "e", full: "Elle révise sa leçon de piano." },
  { sentence: "Vous saut...", rest: " très haut.", answer: "ez", full: "Vous sautez très haut." },
  { sentence: "Je pens...", rest: " faire un tour au parc.", answer: "e", full: "Je pense faire un tour au parc." },
  { sentence: "Tu manges...", rest: " une grosse pomme rouge.", answer: "es", full: "Tu manges une grosse pomme rouge." },
  { sentence: "Les bébés pleur...", rest: " quand ils ont faim.", answer: "ent", full: "Les bébés pleurent quand ils ont faim." },
  { sentence: "Mon cousin et moi regard...", rest: " la télé.", answer: "ons", full: "Mon cousin et moi regardons la télé." },
  { sentence: "Vous donn...", rest: " votre avis.", answer: "ez", full: "Vous donnez votre avis." },
  { sentence: "L'avion décoll...", rest: " vers le soleil.", answer: "e", full: "L'avion décolle vers le soleil." },
  { sentence: "Les joueurs entr...", rest: " sur le terrain.", answer: "ent", full: "Les joueurs entrent sur le terrain." },
  { sentence: "Tu arriv...", rest: " le premier !", answer: "es", full: "Tu arrives le premier !" },
  { sentence: "Nous nag...", rest: " dans la grande piscine.", answer: "ons", full: "Nous nageons dans la grande piscine." },
  { sentence: "Vous rang...", rest: " votre cartable.", answer: "ez", full: "Vous rangez votre cartable." },
  { sentence: "Je port...", rest: " des bottes en caoutchouc.", answer: "e", full: "Je porte des bottes en caoutchouc." },
  { sentence: "Elle téléphon...", rest: " à sa meilleure amie.", answer: "e", full: "Elle téléphone à sa meilleure amie." },
  { sentence: "Tu cherch...", rest: " ton chat dans le grenier.", answer: "es", full: "Tu cherches ton chat dans le grenier." },
  { sentence: "Les fleurs fân...", rest: " sans eau.", answer: "ent", full: "Les fleurs fânent sans eau." },
  { sentence: "Mes parents aim...", rest: " voyager l'été.", answer: "ent", full: "Mes parents aiment voyager l'été." },
  { sentence: "Nous pli...", rest: " les draps doucement.", answer: "ons", full: "Nous plions les draps doucement." },
  { sentence: "Vous détest...", rest: " les jours de pluie.", answer: "ez", full: "Vous détestez les jours de pluie." }
];

// Liste des pronoms affichés sur les boutons (SANS JE/TU)
const pronounsList = ["Il", "Elle", "Nous", "Vous", "Ils", "Elles"];
const endingsList = ["e", "es", "ons", "ez", "ent"];

const CLASSES = ["CP A", "CP B", "CE1 A", "CE1 B", "CE2 A", "CE2 B", "CM1 A", "CM1 B", "CM2 A", "CM2 B"];

function FrenchGames() {
  const { theme } = React.useContext(ThemeContext);
  const isDark = theme === 'dark';
  // --- ETATS ---
  const [selectedGame, setSelectedGame] = useState(null);
  const [timeLeft, setTimeLeft] = useState(100); // 100 sec au départ
  const [speedFactor, setSpeedFactor] = useState(1); // Facteur de vitesse
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState({ gn: "", rest: "", answer: "" });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showPenalty, setShowPenalty] = useState(false);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showAllScores, setShowAllScores] = useState(false);

  // --- LEADERBOARD & JOUEUR ---
  const [topScores, setTopScores] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [playerClass, setPlayerClass] = useState("");
  const [savingScore, setSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  const getCollectionName = useCallback(() => {
    if (selectedGame === 'conjugaison_present_1') return "leaderboard_conjugaison_p1";
    return "leaderboard_pronoms";
  }, [selectedGame]);

  // --- LOGIQUE FIREBASE ---
  const loadTopScores = useCallback(async () => {
    try {
      const colName = getCollectionName();
      const q = query(collection(db, colName), orderBy("score", "desc"), limit(15));
      const snapshot = await getDocs(q);
      const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopScores(scores);
    } catch (error) {
      console.error("Erreur leaderboard:", error);
    }
  }, [getCollectionName]);

  // --- LOGIQUE DU JEU ---
  const getNextQuestion = useCallback(() => {
    if (selectedGame === 'conjugaison_present_1') {
      const randomIndex = Math.floor(Math.random() * conjugaisonPresent1Bank.length);
      return conjugaisonPresent1Bank[randomIndex];
    }
    const randomIndex = Math.floor(Math.random() * questionsBank.length);
    return questionsBank[randomIndex];
  }, [selectedGame]);

  const startGame = () => {
    setCurrent(getNextQuestion());
    setTimeLeft(100); // Reset à 100
    setSpeedFactor(1); // Reset vitesse
    setScore(0);
    setGameOver(false);
    setRunning(true);
    setScoreSaved(false);
    setSavingScore(false);
    setShowPenalty(false);
  };

  const goMenu = () => {
    setRunning(false);
    setGameOver(false);
    setSelectedGame(null);
    setTopScores([]);
    setIsAudioMode(false);
    setIsPracticeMode(false);
  };

  const saveScore = async () => {
    if (!playerName) return;
    setSavingScore(true);
    try {
      const colName = getCollectionName();
      const cleanPseudo = playerName.slice(0, 12);
      const q = query(collection(db, colName), where("pseudo", "==", cleanPseudo));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        if (score > existingDoc.data().score) {
          await updateDoc(doc(db, colName, existingDoc.id), { score: score, date: new Date().toISOString(), classLabel: playerClass });
        }
      } else {
        await addDoc(collection(db, colName), {
          pseudo: cleanPseudo,
          score: score,
          date: new Date().toISOString(),
          classLabel: playerClass
        });
      }
      await loadTopScores();
      setScoreSaved(true);
      startGame();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Problème de connexion à la base de données.");
      setSavingScore(false);
    }
  };

  // --- AUDIO ---
  const speak = useCallback((text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    if (running && !gameOver && isAudioMode) {
      if (selectedGame === 'conjugaison_present_1') {
        speak(current.full);
      } else {
        speak(`${current.gn} ... ${current.rest}`);
      }
    }
  }, [current, running, gameOver, isAudioMode, speak]);

  // Timer avec SpeedFactor
  useEffect(() => {
    if (!running) return;
    if (isPracticeMode) return;
    if (timeLeft <= 0) {
      setRunning(false);
      setGameOver(true);
      return;
    }
    // Le temps s'écoule de plus en plus vite selon speedFactor
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000 / speedFactor);
    return () => clearInterval(interval);
  }, [timeLeft, running, speedFactor, isPracticeMode]);

  useEffect(() => {
    if (selectedGame) loadTopScores();
  }, [selectedGame, loadTopScores]);

  // Validation réponse
  const handleAnswer = (chosenPronoun) => {
    if (!running || gameOver) return;

    if (chosenPronoun.toLowerCase() === current.answer.toLowerCase()) {
      // BONNE RÉPONSE
      setScore(score + 1);
      if (!isPracticeMode) {
        setSpeedFactor((prev) => prev * 1.1); // On accélère le temps
        setTimeLeft(100); // On remet le temps à fond
      }
      setCurrent(getNextQuestion());
    } else {
      // MAUVAISE RÉPONSE
      if (!isPracticeMode) setTimeLeft((prev) => Math.max(prev - 5, 0)); // Pénalité -5s
      setShowPenalty(true);
      setTimeout(() => setShowPenalty(false), 800);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link to="/games" className="relative md:absolute top-0 left-0 md:top-6 md:left-6 z-10 w-fit mb-6 md:mb-0 flex items-center gap-2 px-4 py-2 text-sm rounded-full font-bold text-brand-text bg-white/40 border border-white/50 hover:bg-white/80 transition-all shadow-soft backdrop-blur-md">
        ← Retour
      </Link>

      {!selectedGame ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-text">Français 📚</h1>
            <p className="text-brand-text/70 text-lg">Choisis ton exercice :</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <div
              className="group relative flex flex-col items-center p-6 rounded-[24px] border border-white/50 bg-white/40 hover:bg-white/80 transition-all cursor-pointer backdrop-blur-xl shadow-soft"
              onClick={() => setSelectedGame('pronoms')}
            >
              <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">👤</span>
              <h3 className="text-lg font-bold group-hover:text-brand-coral text-brand-text transition-colors">Les Pronoms</h3>
              <p className="text-brand-text/60 text-sm font-medium">Remplace le groupe nominal</p>
            </div>

            <div
              className="group relative flex flex-col items-center p-6 rounded-[24px] border border-white/50 bg-white/40 hover:bg-white/80 transition-all cursor-pointer backdrop-blur-xl shadow-soft"
              onClick={() => setSelectedGame('conjugaison_present_1')}
            >
              <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">⏳</span>
              <h3 className="text-lg font-bold group-hover:text-brand-coral text-brand-text transition-colors">Conjugaison</h3>
              <p className="text-brand-text/60 text-sm font-medium">Présent - Verbes du 1er groupe</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl mx-auto border border-white/50 p-8 rounded-[30px] bg-white/40 backdrop-blur-xl shadow-soft mt-10">
          <div className="flex justify-between items-center mb-8">
            <button
              className="px-4 py-2 text-sm font-bold rounded-full bg-white text-brand-text border border-brand-text/10 hover:bg-brand-coral hover:text-white transition-all shadow-sm"
              onClick={goMenu}
            >
              ⬅ Menu Français
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-brand-text">
              {selectedGame === 'conjugaison_present_1' ? 'Conjugaison : Présent (1er gr)' : 'Grammaire : Pronoms'} 📚
            </h1>
          </div>

          <div className="p-6 rounded-[24px] mb-8 border border-white/40 bg-white/60 shadow-inner">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-brand-teal">
              <Trophy size={20} className="text-brand-coral" /> Classement
            </h3>

            {topScores.length > 0 ? (
              <div className="flex flex-col">
                {/* PODIUM */}
                <div className="flex justify-center items-end gap-2 sm:gap-4 mb-6 px-2 pt-4">
                  {/* 2ND PLACE */}
                  <div className="flex flex-col items-center w-1/3">
                    {topScores[1] ? (
                      <>
                        <div className="relative flex flex-col items-center justify-end w-full rounded-t-2xl p-2 border-t border-l border-r border-white/50 bg-brand-bg/50 backdrop-blur-sm" style={{ height: '120px' }}>
                          <span className="text-2xl mb-1 drop-shadow-sm">🥈</span>
                          <span className="font-bold text-center text-sm truncate w-full text-brand-text">{topScores[1].pseudo}</span>
                          <span className="text-xs text-brand-text/60 font-medium">{topScores[1].score} pts</span>
                        </div>
                        <div className="w-full h-2 bg-brand-teal mt-1 rounded-full"></div>
                      </>
                    ) : <div className="h-[120px]"></div>}
                  </div>

                  {/* 1ST PLACE */}
                  <div className="flex flex-col items-center w-1/3">
                    {topScores[0] ? (
                      <>
                        <div className="mb-2"><Trophy size={28} className="text-brand-coral drop-shadow-md animate-bounce" /></div>
                        <div className="relative flex flex-col items-center justify-end w-full rounded-t-2xl p-2 border-t border-l border-r border-white/60 bg-gradient-to-b from-brand-peach/40 to-white/20 backdrop-blur-md shadow-[0_0_20px_rgba(235,172,162,0.4)]" style={{ height: '150px' }}>
                          <span className="text-3xl mb-1 drop-shadow-sm">👑</span>
                          <span className="font-bold text-center truncate w-full text-brand-coral">{topScores[0].pseudo}</span>
                          <span className="font-black text-brand-text">{topScores[0].score} pts</span>
                        </div>
                        <div className="w-full h-2 bg-brand-coral mt-1 rounded-full"></div>
                      </>
                    ) : null}
                  </div>

                  {/* 3RD PLACE */}
                  <div className="flex flex-col items-center w-1/3">
                    {topScores[2] ? (
                      <>
                        <div className="relative flex flex-col items-center justify-end w-full rounded-t-2xl p-2 border-t border-l border-r border-white/50 bg-brand-bg/40 backdrop-blur-sm" style={{ height: '100px' }}>
                          <span className="text-2xl mb-1 drop-shadow-sm">🥉</span>
                          <span className="font-bold text-center text-sm truncate w-full text-brand-text/80">{topScores[2].pseudo}</span>
                          <span className="text-xs text-brand-text/70">{topScores[2].score} pts</span>
                        </div>
                        <div className="w-full h-2 bg-brand-text/30 mt-1 rounded-full"></div>
                      </>
                    ) : <div className="h-[100px]"></div>}
                  </div>
                </div>

                {/* LIST (4th - 15th) */}
                {topScores.length > 3 && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowAllScores(!showAllScores)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold transition-all rounded-xl hover:bg-white text-brand-text/60 hover:text-brand-text bg-white/40 shadow-sm border border-white/50"
                    >
                      {showAllScores ? <><ChevronUp size={16} /> Masquer la suite</> : <><ChevronDown size={16} /> Voir la suite ({topScores.length - 3})</>}
                    </button>

                    {showAllScores && (
                      <div className="mt-3 space-y-2 rounded-2xl p-2 bg-white/30 backdrop-blur-sm border border-white/30">
                        {topScores.slice(3).map((score, index) => (
                          <div key={score.id || index} className="flex items-center justify-between px-4 py-3 rounded-[16px] bg-white/60 hover:bg-white/90 border border-white/50 shadow-sm transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 text-xs font-bold rounded-full bg-brand-bg text-brand-text shadow-inner border border-brand-text/5">{index + 4}</span>
                              <span className="text-sm font-bold text-brand-text">{score.pseudo} <span className="opacity-60 text-xs font-medium">({score.classLabel || "?"})</span></span>
                            </div>
                            <strong className="text-sm text-brand-teal font-black">{score.score}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 italic">Aucun score enregistré pour le moment...</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-4 rounded-[20px] border border-white/50 text-center flex flex-col relative overflow-hidden bg-brand-teal text-white shadow-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider mb-1 text-white/70">Temps</span>
              <strong className="text-4xl font-black drop-shadow-sm">{isPracticeMode ? "∞" : `${timeLeft.toFixed(0)} s`}</strong>
              {showPenalty && !isPracticeMode && <span className="absolute top-2 right-2 text-brand-coral bg-white px-2 py-0.5 rounded-full text-xs font-black animate-ping">-5s</span>}
            </div>
            <div className="p-4 rounded-[20px] border border-white/60 text-center flex flex-col bg-white/80 backdrop-blur-sm shadow-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider mb-1 text-brand-text/50">Score</span>
              <strong className="text-4xl font-black text-brand-coral drop-shadow-sm">{score}</strong>
            </div>
          </div>

          {!running && (
            <div className="mb-6 space-y-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  className="flex-1 w-2/3 border border-white/50 rounded-2xl px-5 py-4 outline-none transition-all bg-white/60 text-brand-text placeholder-brand-text/40 focus:border-brand-teal focus:bg-white shadow-inner font-semibold"
                  placeholder="Ton pseudo"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={12}
                  autoFocus
                />
                <select
                  className="w-1/3 border border-white/50 rounded-2xl px-5 py-4 outline-none transition-all bg-white/60 text-brand-text focus:border-brand-teal focus:bg-white shadow-inner font-semibold cursor-pointer"
                  value={playerClass}
                  onChange={(e) => setPlayerClass(e.target.value)}
                >
                  <option value="">Ta classe</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setIsAudioMode(!isAudioMode)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 shadow-sm ${isAudioMode ? 'bg-brand-teal text-white border-brand-teal' : 'bg-white/40 border-white/60 text-brand-text/60 hover:bg-white hover:text-brand-text'}`}
                >
                  {isAudioMode ? <><Volume2 size={16} /> Audio Activé</> : <><VolumeX size={16} /> Audio Désactivé</>}
                </button>
                <button
                  onClick={() => setIsPracticeMode(!isPracticeMode)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 shadow-sm ${isPracticeMode ? 'bg-brand-peach text-brand-text border-brand-coral/30' : 'bg-white/40 border-white/60 text-brand-text/60 hover:bg-white hover:text-brand-text'}`}
                >
                  {isPracticeMode ? "🧘 Entraînement : ON" : "⚡ Entraînement : OFF"}
                </button>
              </div>
            </div>
          )}

          {!running && !gameOver && playerName && playerClass && (
            <button
              className="w-full py-4 px-6 bg-brand-coral hover:bg-brand-coral/90 text-white text-lg font-black rounded-2xl shadow-soft transition-all active:scale-95"
              onClick={startGame}
            >
              🎮 Démarrer ({playerName})
            </button>
          )}

          {running && !gameOver && (
            <div className="flex flex-col items-center max-w-sm mx-auto w-full">
              <div className="text-center mb-8 text-2xl flex flex-col items-center gap-2 text-brand-text">
                <div className="flex items-center gap-3">
                  {selectedGame === 'conjugaison_present_1' ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{current.sentence}</span>
                      <span className="text-brand-coral font-black border-b-4 border-brand-coral/20 min-w-[2.5rem]">?</span>
                      <span className="font-medium">{current.rest}</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-brand-coral font-black drop-shadow-sm">{current.gn}</span> {current.rest}
                    </>
                  )}
                  <button
                    onClick={() => speak(selectedGame === 'conjugaison_present_1' ? current.full : `${current.gn} ... ${current.rest}`)}
                    className="p-3 rounded-full hover:bg-white/60 bg-white/40 transition-all text-brand-teal shadow-sm border border-white/50"
                    title="Répéter"
                  >
                    <Volume2 size={24} />
                  </button>
                </div>
              </div>
              <p className="text-brand-text/60 text-sm font-bold tracking-wide uppercase text-center mb-6">
                {selectedGame === 'conjugaison_present_1' ? 'Trouve la bonne terminaison' : 'Par quel pronom peux-tu remplacer ce qui est en couleur ?'}
              </p>

              <div className={`grid ${selectedGame === 'conjugaison_present_1' ? 'grid-cols-3' : 'grid-cols-2'} gap-4 w-full`}>
                {(selectedGame === 'conjugaison_present_1' ? endingsList : pronounsList).map((choice) => (
                  <button
                    key={choice}
                    className={`py-6 px-2 border border-white/60 rounded-[20px] font-black text-xl transition-all active:scale-95 bg-white/60 hover:bg-brand-coral text-brand-text hover:text-white shadow-soft ${selectedGame === 'conjugaison_present_1' ? 'text-lg' : 'text-xl'}`}
                    onClick={() => handleAnswer(choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
              {isPracticeMode && (
                <button
                  onClick={() => { setRunning(false); setGameOver(true); }}
                  className="mt-6 w-full py-2 text-sm font-bold text-brand-coral/70 hover:text-brand-coral hover:bg-brand-coral/10 rounded-full transition-colors"
                >
                  Arrêter l'entraînement
                </button>
              )}
            </div>
          )}

          {gameOver && (
            <div className="text-center space-y-8 py-6">
              <h2 className="text-4xl font-black text-brand-text">{isPracticeMode ? "Entraînement terminé" : "⏰ Temps écoulé !"}</h2>
              <div className="bg-white/50 border border-white/60 p-6 rounded-[24px] shadow-inner inline-block">
                <p className="text-brand-text/60 font-bold uppercase tracking-widest text-sm mb-2">Score final</p>
                <div className="text-6xl font-black text-brand-teal drop-shadow-md">{score}</div>
              </div>
              <div className="space-y-4 max-w-sm mx-auto">
                {!scoreSaved && !isPracticeMode && (
                  <button
                    className="w-full py-4 text-lg bg-brand-coral hover:bg-brand-coral/90 text-white font-black rounded-2xl shadow-soft transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={saveScore}
                    disabled={savingScore}
                  >
                    {savingScore ? "Sauvegarde..." : "💾 Sauvegarder le score"}
                  </button>
                )}
                <button
                  className="w-full py-4 text-lg font-bold rounded-2xl transition-all bg-white/60 text-brand-text/80 hover:bg-white hover:text-brand-text border border-white/50 shadow-sm"
                  onClick={startGame}
                >
                  {scoreSaved ? "🔄 Rejouer" : "Rejouer sans sauvegarder"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FrenchGames;