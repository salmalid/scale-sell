<div align="center">

# 🍎 Scale-Sell

### AI-Powered Fruit Recognition & Checkout System

*Automated supermarket checkout using computer vision and machine learning*

</div>

---

## 📖 About

**Scale-Sell** is an intelligent checkout system designed for supermarkets in Morocco. It uses Google Gemini AI and computer vision to automatically identify fruits and vegetables, estimate their weight, and calculate prices in Moroccan Dirhams (DH/kg).

### 🎯 Key Highlights

- 🤖 **AI-Powered Classification** 
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
