# 🛡️ WeaponGuard AI - Système de Détection d'Armes

**WeaponGuard AI** est une application web de pointe conçue pour la détection automatique d'armes dans les images et vidéos. Utilisant l'intelligence artificielle de pointe avec YOLOv8m, ce système offre une surveillance en temps réel et une analyse post-événement pour renforcer la sécurité.

## ✨ Fonctionnalités Principales

### 🎯 Analyse d'Images
- **Détection IA** : Détecte automatiquement les armes dans les images téléchargées
- **Confiance en Temps Réel** : Affichage immédiat du niveau de confiance de la détection
- **Bounding Boxes** : Visualisation précise des zones suspectes sur l'image
- **Historique Complet** : Sauvegarde de toutes les analyses effectuées avec détails complets

### 📹 Surveillance en Direct
- **Analyse Vidéo Live** : Détection d'armes en temps réel à partir de la webcam
- **Mode Caméra** : Basculement entre caméra avant et arrière
- **Alertes Instantanées** : Notifications visuelles dès la détection d'une arme
- **Interface Réactive** : Interface utilisateur fluide avec mises à jour en temps réel

### 📊 Dashboard Complet
- **Statistiques Globales** : Vue d'ensemble des détections totales et récentes
- **Historique Récent** : Accès rapide aux dernières analyses effectuées
- **Indicateurs Clés** : Visualisation des tendances et activités récentes
- **Design Moderne** : Interface utilisateur professionnelle et intuitive

### 🔐 Sécurité et Authentification
- **Connexion Sécurisée** : Système d'authentification avec JWT
- **Inscription Utilisateur** : Création de comptes sécurisés
- **Protection des Données** : Accès restreint aux analyses personnelles
- **Gestion de Session** : Maintien sécurisé de la connexion

## 🚀 Technologies Utilisées

### Frontend
- **Next.js 16** : Framework React pour le rendu côté serveur et statique
- **TypeScript** : Typage statique pour une meilleure robustesse du code
- **Tailwind CSS** : Framework CSS utilitaire pour un design rapide et réactif
- **Shadcn UI** : Composants UI modernes et accessibles
- **Zustand** : Gestion d'état légère et performante

### Backend
- **FastAPI** : Framework Python pour API web haute performance
- **PyTorch** : Framework d'apprentissage profond
- **YOLOv8m** : Modèle de détection d'objets de pointe
- **SQLAlchemy** : ORM pour la gestion de base de données
- **PostgreSQL** : Base de données relationnelle
- **Alembic** : Outil de migration de base de données

## 📂 Structure du Projet

```
weapon_detection/
├── backend/                  # API FastAPI et logique métier
│   ├── app/
│   │   ├── api/              # Endpoints API
│   │   ├── core/             # Configuration et sécurité
│   │   ├── models/           # Modèles SQLAlchemy
│   │   ├── schemas/          # Schémas de données Pydantic
│   │   ├── services/         # Services métier
│   │   └── main.py           # Point d'entrée de l'API
│   ├── migrations/           # Migrations Alembic
│   ├── requirements.txt      # Dépendances Python
│   └── Dockerfile            # Conteneur Docker
│
├── frontend/                 # Application Next.js
│   ├── app/                  # Pages de l'application
│   ├── components/           # Composants React réutilisables
│   ├── lib/                  # Utilitaires et hooks
│   ├── public/               # Fichiers statiques
│   ├── styles/               # Styles globaux
│   ├── .env.local            # Variables d'environnement
│   └── next.config.ts        # Configuration Next.js
│
├── .gitignore                # Fichiers ignorés par Git
├── docker-compose.yml        # Orchestration Docker
├── README.md                 # Ce fichier
└── docker-compose.yml        # Orchestration Docker
```

## 🚀 Installation et Démarrage

### Prérequis
- **Docker** et **Docker Compose** installés
- **Node.js** (v18+) et **npm** installés (pour le développement)
- **Python** (v3.10+) et **pip** installés (pour le développement)

### Démarrage avec Docker

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/skouza101/weapon_detection.git
   cd weapon_detection
   ```

2. **Démarrer les services**
   ```bash
   docker-compose up --build
   ```

3. **Accéder à l'application**
   - **Frontend** : [http://localhost:3000](http://localhost:3000)
   - **API Backend** : [http://localhost:8000](http://localhost:8000)
   - **Documentation API** : [http://localhost:8000/docs](http://localhost:8000/docs)

### Développement Local

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 🛠️ Utilisation

### 1. Inscription et Connexion
- Visitez [http://localhost:3000/register](http://localhost:3000/register) pour créer un compte
- Connectez-vous avec vos identifiants sur [http://localhost:3000/login](http://localhost:3000/login)

### 2. Analyse d'Image
- Allez sur [http://localhost:3000/analyze](http://localhost:3000/analyze)
- Téléchargez une image ou glissez-déposez-la
- Obtenez les résultats de détection instantanément

### 3. Surveillance en Direct
- Allez sur [http://localhost:3000/live](http://localhost:3000/live)
- Cliquez sur "Démarrer la Caméra"
- Observez les détections en temps réel
- Basculez entre caméra avant et arrière si nécessaire

### 4. Dashboard
- Accédez au [http://localhost:3000](http://localhost:3000)
- Consultez les statistiques globales et l'historique récent

## 🧪 Tests

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
pytest
```

## 🚀 Déploiement

### Déploiement Docker
```bash
# Build et démarrage
docker-compose up -d --build

# Arrêter les services
docker-compose down

# Nettoyer et reconstruire
docker-compose down -v
docker-compose up -d --build
```

### Variables d'Environnement

**Frontend** (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** (`.env`)
```env
DATABASE_URL=postgresql://user:password@db:5432/weapon_detection
JWT_SECRET=your_secret_key
ALGORITHM=HS256
```

## 🤝 Contribuer

1. **Fork** le projet
2. Créez une **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une **Pull Request**

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur le dépôt GitHub.

---

**Développé avec ❤️ par Marwane Oraiche**
