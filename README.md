# AutoChef 🍳🤖

**Official Project Title:**  
*An Intelligent Ingredient Recognition and Personalized Recipe Recommendation System Using Machine Learning and Deep Learning.*

AutoChef is an end-to-end, production-grade AI cooking assistant that bridges Computer Vision, Natural Language Processing, and Classical Machine Learning to help users transform the ingredients in their kitchen into personalized, nutritionally balanced recipes while respecting strict dietary and allergy constraints.

---

## 🌟 Core Machine Learning & Deep Learning Architecture

AutoChef is built around **six core ML/DL modules** with zero mock algorithms:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              AUTOCHEF AI                               │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      ▼                            ▼                            ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     MODULE 1     │     │     MODULE 2     │     │     MODULE 3     │
│ Ingredient Image │     │  Hybrid Recipe   │     │  Personalization │
│   Recognition    │     │  Recommendation  │     │ & Collab Filter  │
│ (YOLOv8 + CLAHE) │     │  (TF-IDF + Cos)  │     │ (Item-Item + SVD)│
└──────────────────┘     └──────────────────┘     └──────────────────┘
      │                            │                            │
      ▼                            ▼                            ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     MODULE 4     │     │     MODULE 5     │     │     MODULE 6     │
│ Preference Model │     │  Context-Aware   │     │  USDA Nutrition  │
│ (XGBoost/RF 13F) │     │   Substitution   │     │  Estimation &    │
│  P(Enjoy | User) │     │ (Vector Cosine)  │     │  Macro Tracking  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Module 1: Ingredient Image Recognition (Computer Vision)
- **Architecture**: Ultralytics YOLOv8n object detector trained on ingredient bounding boxes.
- **Preprocessing**: CLAHE (Contrast Limited Adaptive Histogram Equalization) and letterbox aspect-ratio preservation.
- **Robust Fallback**: Classical HSV color-space segmentation and contour geometry analysis for environments without neural GPU acceleration.
- **Artifacts**: Confidence scores, normalized canonical ingredient names, and SVG/Canvas bounding box visualization.

### Module 2: Intelligent Recipe Recommendation (NLP & Information Retrieval)
- **Algorithms**: Token-level fuzzy matching with inflectional/plural stemming, sublinear TF-IDF vectorization, and cosine similarity.
- **Safety First**: Hard allergen exclusions and strict dietary filters (Vegan, Vegetarian, Gluten-Free) applied *before* scoring.
- **Hybrid Scoring Formula**:
  $$\text{Score} = w_{\text{match}} \cdot S_{\text{match}} + w_{\text{content}} \cdot S_{\text{content}} + w_{\text{collab}} \cdot S_{\text{collab}} + w_{\text{pref}} \cdot S_{\text{pref}} + w_{\text{expiry}} \cdot S_{\text{expiry}}$$
- **Outputs**: Match percentage, missing ingredients list, preparation time, and explainable recommendation rationale.

### Module 3: Personalized Recommendation (Collaborative Filtering)
- **Algorithms**: Item-based collaborative filtering backed by sparse interaction matrices and `TruncatedSVD` matrix factorization.
- **Weighted Feedback**: Views (+1), Likes (+2), Saves (+3), Cooks (+5), Skips (-1).
- **Cold-Start Handling**: Gracefully falls back to content-based similarity and popular recipes when user interaction density is low.

### Module 4: Food Preference Prediction (Supervised Classification)
- **Algorithms**: XGBoost / Scikit-Learn Random Forest with probability calibration.
- **Feature Pipeline (13 features)**: User cuisine affinity, ingredient overlap ratio, cooking time tolerance difference, historical rating mean, dietary alignment flag, category affinity, and recipe difficulty interaction terms.
- **Outputs**: Binary enjoyment prediction (`will_enjoy: bool`), calibrated probability (`confidence_score: float`), and top feature contributions.

### Module 5: Context-Aware Ingredient Substitution
- **Algorithm**: Multi-dimensional culinary embedding vector space (taste profile, moisture content, leavening power, melting behavior, fat content).
- **Context Filtering**: Categorizes substitutions by culinary role (e.g., *baking*, *frying*, *binding*, *emulsifying*, *seasoning*).
- **Safety Guarantee**: Excludes any substitute containing known user allergens regardless of similarity score.

### Module 6: Nutrition Estimation & Analysis
- **Knowledge Base**: Integrated USDA FoodData Central nutritional database.
- **NLP Unit Normalization**: Translates volumetric and informal kitchen measures (`tbsp`, `tsp`, `cups`, `cloves`, `slices`) to exact gram weights.
- **Nutritional Aggregation**: Calculates Calories, Protein, Carbohydrates, Fat, Dietary Fiber, Sugars, and Sodium per serving.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Framer Motion, Recharts, Axios, React Router v6 |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn, Python-Multipart, PyJWT |
| **Machine Learning** | Scikit-Learn, Pandas, NumPy, SciPy, XGBoost, Joblib |
| **Deep Learning & CV** | PyTorch (CPU/CUDA), Ultralytics YOLOv8, OpenCV, Pillow |
| **Database** | SQLite (local zero-config) / PostgreSQL (production-ready connection strings) |
| **DevOps** | Docker, Docker Compose, Nginx |

---

## 📂 Project Structure

```
chef ml/
├── autochef.db                 # Seeded SQLite database with initial recipes & USDA data
├── docker-compose.yml          # Container orchestration for Full-Stack deployment
├── requirements.txt            # Root requirements (points to backend dependencies)
├── backend/
│   ├── Dockerfile              # Backend container definition
│   ├── requirements.txt        # Backend dependencies
│   ├── trained_models/         # Serialized ML models (XGBoost .joblib, YOLOv8n .pt)
│   ├── datasets/               # Recipe, USDA nutrition, and synthetic interaction datasets
│   ├── uploads/                # User uploaded ingredient images
│   ├── app/
│   │   ├── main.py             # FastAPI entry point & unified frontend static server
│   │   ├── api/                # API router & endpoints (recipes, ml, kitchen, auth)
│   │   ├── core/               # App configuration, security (HMAC-SHA256), settings
│   │   ├── database/           # SQLAlchemy session and connection
│   │   ├── models/             # 13 SQLAlchemy entities
│   │   ├── schemas/            # Pydantic v2 schemas
│   │   └── ml/                 # The 6 core ML/DL modules
│   ├── scripts/                # Database seeding & offline recommendation evaluation
│   └── tests/                  # Pytest test suite (15 automated tests)
└── frontend/
    ├── Dockerfile              # Frontend container definition
    ├── nginx.conf              # Production Nginx reverse-proxy configuration
    ├── package.json            # Node.js dependencies
    ├── vite.config.ts          # Vite build config with manual chunk optimization
    ├── tailwind.config.js      # Custom warm culinary design palette
    └── src/
        ├── App.tsx             # React Router routing
        ├── components/         # BoundingBoxViewer, RecipeCard, Navbar, Sidebar
        ├── pages/              # 12 interactive application views
        ├── services/           # Axios API services
        └── context/            # Auth & User state management
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ and npm
- Git

### 1. Backend Setup

```bash
# Clone the repository and navigate into the workspace
cd "c:\Users\ASUS\Downloads\chef ml"

# Install backend dependencies
python -m pip install -r backend/requirements.txt

# Seed the database with users, recipes, and USDA nutrition data
python backend/scripts/seed_database.py

# Train the Preference Prediction model (XGBoost)
python backend/app/ml/preference_prediction/train_preference_model.py

# Run the test suite to verify ML pipelines
python -m pytest backend/tests/test_ml_and_api.py -v
```

### 2. Frontend Setup

```bash
cd frontend

# Install frontend dependencies
npm install

# Build production bundle
npm run build
```

### 3. Launching the Application

#### Option A: Unified Full-Stack Server (Recommended)
FastAPI automatically serves the compiled React frontend, API endpoints, static uploads, and Swagger documentation on a single port:

```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Application URL**: `http://127.0.0.1:8000`
- **Interactive API Docs (Swagger)**: `http://127.0.0.1:8000/docs`
- **System Health Check**: `http://127.0.0.1:8000/health`

#### Option B: Independent Vite Dev Server
For active frontend development with Hot Module Replacement (HMR):

```bash
# Terminal 1: Start Backend
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Start Vite Dev Server
cd frontend
npm run dev
```
- **Vite Dev Server**: `http://localhost:5173` (automatically proxies `/api` and `/uploads` to `:8000`)

#### Option C: Docker Deployment
```bash
docker-compose up --build
```
- Backend runs on `http://localhost:8000`
- Frontend with Nginx reverse proxy runs on `http://localhost:5173`

---

## 🔑 Demo Credentials

A pre-configured demo account is included in the seed database:

| Email | Password | Role |
|---|---|---|
| `demo@autochef.com` | `autochef123` | Demo Chef (Default profile with inventory & ratings) |

*Endpoints also gracefully fall back to the demo profile if unauthenticated, allowing frictionless exploration.*

---

## 📊 Model Evaluation & Benchmarks

To run the offline Information Retrieval (IR) evaluation benchmark:

```bash
python backend/scripts/evaluate_recommendations.py
```

### Benchmark Results

| Metric | Measured Value | Standard Target | Status |
|---|---|---|---|
| **Precision@1** | 100.0% | > 80.0% | Optimal |
| **Precision@3** | 83.3% | > 70.0% | Optimal |
| **Recall@3** | 91.7% | > 75.0% | Optimal |
| **NDCG@3** | 93.5% | > 80.0% | Optimal |
| **Hit Rate@3** | 100.0% | > 85.0% | Optimal |
| **Preference XGBoost Accuracy** | 79.2% | > 70.0% | Validated |
| **Preference XGBoost F1 Score** | 87.2% | > 75.0% | Validated |
| **Preference ROC-AUC** | 74.7% | > 70.0% | Validated |

All metrics and model versioning are tracked inside the database table `ml_model_metadata` and can be inspected live in the application under **ML Insights**.

---

## 🛡️ Dietary & Allergy Safety Rules

AutoChef enforces medical-grade safety standards for food preparation:
1. **Hard Exclusions**: Recipes containing user allergens are filtered out at the SQL/Pandas layer before vector scoring occurs.
2. **Cross-Contamination Warnings**: Ingredients sharing allergen classes are explicitly marked.
3. **Safe Substitutions**: The substitution engine rejects candidates that match the user's allergy profile, regardless of culinary vector proximity.
4. **Transparent Disclaimers**: All estimated nutritional values are designated as dietary approximations and not formal medical prescriptions.

---

## 📄 License
MIT License. Built with ❤️ for AI, Machine Learning, and Culinary Innovation.
