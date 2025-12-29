<div align="center">

# 🍎 Scale-Sell

### AI-Powered Fruit Recognition & Checkout System

*Automated supermarket checkout using computer vision and machine learning*

</div>

---

## 📖 About

**Scale-Sell** is an intelligent checkout system designed for supermarkets in Morocco. It uses Google Gemini AI and computer vision to automatically identify fruits and vegetables, estimate their weight, and calculate prices in Moroccan Dirhams (DH/kg).

### 🎯 Key Highlights

- 🤖 **AI-Powered Classification** - Uses Google Gemini 2.5 Flash for accurate fruit recognition
- ⚖️ **Smart Weight Estimation** - Combines AI analysis with computer vision for precise weight calculation
- 🎨 **K-means Segmentation** - Advanced image segmentation for fruit isolation
- 💰 **Real-time Pricing** - Instant price calculation based on weight and market rates
- 🇲🇦 **Morocco-Specific** - Prices in Moroccan Dirhams with local market data

---

## ✨ Features

### Backend (FastAPI)
- ✅ **loooot of Fruit/Vegetable Classes** - Comprehensive classification model
- ✅ **Gemini AI Integration** - Advanced vision-based fruit recognition
- ✅ **Weight Estimation** - Multi-method weight calculation (AI + CV)
- ✅ **Image Segmentation** - K-means clustering for fruit isolation
- ✅ **RESTful API** - Well-documented endpoints with Pydantic validation
- ✅ **Real-time Processing** - Fast inference and response times

### Frontend (React + TypeScript)
- ✅ **Camera Integration** - Live camera feed for fruit scanning
- ✅ **Shopping Cart** - Add multiple items and manage quantities
- ✅ **Real-time Preview** - Instant classification results
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **Modern UI** - Built with shadcn/ui and Tailwind CSS

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance web framework |
| **Google Gemini AI** | Fruit classification & weight estimation |
| **TensorFlow/Keras** | ML model inference |
| **OpenCV** | Image processing & computer vision |
| **scikit-learn** | K-means clustering |
| **Pydantic** | Data validation |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type-safe development |
| **Vite** | Fast build tool |
| **shadcn/ui** | Component library |
| **Tailwind CSS** | Utility-first styling |
| **TanStack Query** | Data fetching & caching |

---

## 📁 Project Structure

```
scale-sell/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── utils.py             # K-means utilities
│   │   ├── data/
│   │   │   ├── fruit_prices_maroc.json    # 236 fruits/vegetables
│   │   │   ├── fruit_densities.json       # Density data
│   │   │   └── fruit_dimensions.json      # Size/shape data
│   │   └── models/
│   │       ├── fruit_model_100x100.h5     # ML model (28MB)
│   │       └── class_indices.json         # 412 classes
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── services/            # API integration
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # Page components
│   │   └── types/               # TypeScript types
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Google Gemini API Key** - [Get one here](https://makersuite.google.com/app/apikey)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Run the server
python -m uvicorn app.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file (optional)
echo "VITE_FRUIT_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000
```

### Endpoints

#### 🟢 GET `/`
Health check endpoint

**Response:**
```json
{
  "status": "online",
  "service": "Fruit Recognition API - SuperMarché Maroc",
  "version": "3.0.0",
  "classes_loaded": 412
}
```

#### 🟢 GET `/fruits`
Get all available fruits with prices

**Response:**
```json
[
  {
    "name": "Apple",
    "price_per_kg": 18.0,
    "density": 0.85,
    "dimensions": {...}
  }
]
```

#### 🟡 POST `/classify`
Classify fruit from image

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "pixels_per_cm": 50.0
}
```

**Response:**
```json
{
  "fruit_name": "Apple",
  "confidence": 95.5,
  "emoji": "🍎",
  "price_per_kg": 18.0,
  "weight": {
    "weight_kg": 0.185,
    "weight_grams": 185,
    "quantity": 1,
    "size_category": "medium"
  },
  "total_price": 3.33
}
```

#### 🟡 POST `/segment`
Apply K-means segmentation to image

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "k": 4,
  "color_space": "RGB"
}
```

**Response:**
```json
{
  "segmented_image": "data:image/png;base64,...",
  "fruit_mask": "data:image/png;base64,...",
  "fruit_percentage": 35.5,
  "processing_mode": "utils_kmeans"
}
```

### Interactive API Docs

Visit `http://localhost:8000/docs` for Swagger UI documentation.

---

## 🎨 Features in Detail

### AI-Powered Classification

The system uses **Google Gemini 2.5 Flash** for fruit recognition:
- Identifies 412+ fruit and vegetable varieties
- Detects quantity (multiple fruits in one image)
- Assesses ripeness and quality
- Estimates size (small/medium/large)

### Weight Estimation

Multi-method approach for accurate weight calculation:
1. **Gemini AI Analysis** - Primary method using visual cues
2. **Computer Vision** - Contour detection and size measurement
3. **Database Lookup** - Average weights and densities
4. **Blended Estimation** - Combines all methods for accuracy

### Image Segmentation

K-means clustering for fruit isolation:
- Supports RGB, HSV, and LAB color spaces
- Intelligent background removal
- Morphological operations for refinement
- Returns segmented image and fruit mask

---

## 💡 Usage Example

```python
import requests
import base64

# Read image
with open("apple.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

# Classify fruit
response = requests.post(
    "http://localhost:8000/classify",
    json={
        "image": f"data:image/jpeg;base64,{image_data}",
        "pixels_per_cm": 50.0
    }
)

result = response.json()
print(f"Fruit: {result['fruit_name']} {result['emoji']}")
print(f"Weight: {result['weight']['weight_grams']}g")
print(f"Price: {result['total_price']} DH")
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---


## 👥 Authors

- **SALMA LIDAME* - *AI Engineer*
- **NADA SABER* - *DATA ENGINEER*

---

## 📞 Support

For support, email emadilsalma@gmail.com.

---

<div align="center">

**Made with ❤️ for SuperMarché Maroc**

⭐ Star this repo if you find it helpful!

</div>
