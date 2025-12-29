"""
FastAPI Backend for Fruit Recognition Checkout System
Using Google Gemini API for classification
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import cv2
import json
import os
import base64
from io import BytesIO
from PIL import Image
import logging
from pathlib import Path
import google.generativeai as genai

# Import segmentation utilities from utils.py
from .utils import apply_kmeans, convert_color_space, calculate_metrics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# GEMINI API CONFIGURATION
# =============================================================================

#GEMINI_API_KEY = "AIzaSyAwpXBu7YDcK0s-1h_UmNj5yfyIyjFi1Sc"
GEMINI_API_KEY = "AIzaSyCfMFZHNistNAuGMnRaTabW0x9ShUeR-NM"
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

logger.info("✅ Gemini API configured")

# =============================================================================
# FILE PATHS CONFIGURATION
# =============================================================================

BASE_DIR = Path(__file__).resolve().parent

CLASS_INDICES_PATH = BASE_DIR / "models" / "class_indices.json"
PRICES_PATH = BASE_DIR / "data" / "fruit_prices_maroc.json"
DENSITIES_PATH = BASE_DIR / "data" / "fruit_densities.json"
DIMENSIONS_PATH = BASE_DIR / "data" / "fruit_dimensions.json"

# =============================================================================
# FRUIT EMOJI MAPPING
# =============================================================================

FRUIT_EMOJIS = {
    "apple": "🍎",
    "apricot": "🍑",
    "avocado": "🥑",
    "banana": "🍌",
    "blueberry": "🫐",
    "cactus": "🌵",
    "cantaloupe": "🍈",
    "cherry": "🍒",
    "clementine": "🍊",
    "corn": "🌽",
    "cucumber": "🥒",
    "grape": "🍇",
    "kiwi": "🥝",
    "lemon": "🍋",
    "lime": "🍋",
    "mango": "🥭",
    "onion": "🧅",
    "orange": "🍊",
    "papaya": "🍈",
    "passion fruit": "🥭",
    "peach": "🍑",
    "pear": "🍐",
    "pepper": "🌶️",
    "pineapple": "🍍",
    "plum": "🍑",
    "pomegranate": "🍎",
    "potato": "🥔",
    "raspberry": "🍓",
    "strawberry": "🍓",
    "tomato": "🍅",
    "watermelon": "🍉"
}

# =============================================================================
# FastAPI App Configuration
# =============================================================================

app = FastAPI(
    title="Fruit Recognition API - SuperMarché Maroc",
    description="API for fruit classification, weight estimation, and pricing (DH/kg)",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Global Cache Variables
# =============================================================================

CLASS_INDICES = None
FRUIT_PRICES = None
FRUIT_DENSITIES = None
FRUIT_DIMENSIONS = None

# =============================================================================
# Data Loading Functions
# =============================================================================

def load_class_indices():
    """Load class name mappings from JSON"""
    global CLASS_INDICES
    
    if CLASS_INDICES is not None:
        return CLASS_INDICES
    
    path = str(CLASS_INDICES_PATH)
    
    try:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                indices = json.load(f)
            CLASS_INDICES = {v: k for k, v in indices.items()}
            logger.info(f"✅ Loaded {len(CLASS_INDICES)} class indices")
        else:
            logger.warning(f"⚠️ Class indices file not found: {path}")
            CLASS_INDICES = {}
    except Exception as e:
        logger.error(f"❌ Error loading class indices: {str(e)}")
        CLASS_INDICES = {}
    
    return CLASS_INDICES


def load_fruit_prices():
    """Load fruit prices in DH/kg"""
    global FRUIT_PRICES
    
    if FRUIT_PRICES is not None:
        return FRUIT_PRICES
    
    path = str(PRICES_PATH)
    
    try:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                FRUIT_PRICES = json.load(f)
            logger.info(f"✅ Loaded prices for {len(FRUIT_PRICES)} fruits")
        else:
            logger.warning(f"⚠️ Prices file not found: {path}")
            FRUIT_PRICES = {}
    except Exception as e:
        logger.error(f"❌ Error loading fruit prices: {str(e)}")
        FRUIT_PRICES = {}
    
    return FRUIT_PRICES


def load_fruit_densities():
    """Load fruit densities for weight estimation"""
    global FRUIT_DENSITIES
    
    if FRUIT_DENSITIES is not None:
        return FRUIT_DENSITIES
    
    path = str(DENSITIES_PATH)
    
    try:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                FRUIT_DENSITIES = json.load(f)
            logger.info(f"✅ Loaded densities for {len(FRUIT_DENSITIES)} fruits")
        else:
            logger.warning(f"⚠️ Densities file not found: {path}")
            FRUIT_DENSITIES = {}
    except Exception as e:
        logger.error(f"❌ Error loading fruit densities: {str(e)}")
        FRUIT_DENSITIES = {}
    
    return FRUIT_DENSITIES


def load_fruit_dimensions():
    """Load fruit dimensions for weight estimation"""
    global FRUIT_DIMENSIONS
    
    if FRUIT_DIMENSIONS is not None:
        return FRUIT_DIMENSIONS
    
    path = str(DIMENSIONS_PATH)
    
    try:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                FRUIT_DIMENSIONS = json.load(f)
            logger.info(f"✅ Loaded dimensions for {len(FRUIT_DIMENSIONS)} fruits")
        else:
            logger.warning(f"⚠️ Dimensions file not found: {path}")
            FRUIT_DIMENSIONS = {}
    except Exception as e:
        logger.error(f"❌ Error loading fruit dimensions: {str(e)}")
        FRUIT_DIMENSIONS = {}
    
    return FRUIT_DIMENSIONS


# =============================================================================
# Helper Functions
# =============================================================================

def get_fruit_emoji(fruit_name: str) -> str:
    """Get emoji for a fruit based on its name"""
    fruit_lower = fruit_name.lower()
    
    # Direct match
    for key, emoji in FRUIT_EMOJIS.items():
        if key in fruit_lower:
            return emoji
    
    # Fallback based on color or type
    if "red" in fruit_lower or "pink" in fruit_lower:
        return "🔴"
    elif "green" in fruit_lower:
        return "🟢"
    elif "yellow" in fruit_lower or "golden" in fruit_lower:
        return "🟡"
    elif "blue" in fruit_lower or "purple" in fruit_lower:
        return "🟣"
    elif "white" in fruit_lower:
        return "⚪"
    
    # Default fruit emoji
    return "🍎"


def match_to_class_indices(gemini_fruit_name: str) -> tuple:
    """
    Match Gemini's fruit name to existing class indices
    Returns: (matched_class_name, class_index, emoji)
    """
    class_indices = load_class_indices()
    
    if not class_indices:
        emoji = get_fruit_emoji(gemini_fruit_name)
        return gemini_fruit_name, -1, emoji
    
    gemini_lower = gemini_fruit_name.lower()
    
    # Try exact match first
    for idx, class_name in class_indices.items():
        if class_name.lower() == gemini_lower:
            emoji = get_fruit_emoji(class_name)
            return class_name, idx, emoji
    
    # Try partial match
    best_match = None
    best_score = 0
    
    for idx, class_name in class_indices.items():
        class_lower = class_name.lower()
        
        # Calculate similarity score
        score = 0
        words_gemini = set(gemini_lower.split())
        words_class = set(class_lower.split())
        
        # Common words
        common = words_gemini & words_class
        score += len(common) * 2
        
        # Substring match
        if gemini_lower in class_lower or class_lower in gemini_lower:
            score += 1
        
        if score > best_score:
            best_score = score
            best_match = (class_name, idx)
    
    if best_match and best_score > 0:
        emoji = get_fruit_emoji(best_match[0])
        return best_match[0], best_match[1], emoji
    
    # No match found - use Gemini's name
    emoji = get_fruit_emoji(gemini_fruit_name)
    return gemini_fruit_name, -1, emoji


def decode_base64_image(base64_string: str) -> np.ndarray:
    """Decode base64 image string to numpy array"""
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        image_rgb = image.convert("RGB")
        return np.array(image_rgb)
    except Exception as e:
        logger.error(f"Error decoding base64 image: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid image data")


def detect_fruit_contour(image: np.ndarray) -> Optional[Dict[str, Any]]:
    """Detect fruit contour using edge detection and find bounding box"""
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            largest = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(largest)
            
            if area < 100:
                return None
            
            x, y, w, h = cv2.boundingRect(largest)
            (cx, cy), radius = cv2.minEnclosingCircle(largest)
            perimeter = cv2.arcLength(largest, True)
            circularity = 4 * np.pi * area / (perimeter ** 2) if perimeter > 0 else 0
            
            return {
                "bounding_box": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                "center": {"x": int(cx), "y": int(cy)},
                "radius": float(radius),
                "area_pixels": int(area),
                "perimeter": float(perimeter),
                "circularity": float(circularity)
            }
        
        return None
        
    except Exception as e:
        logger.error(f"Error detecting contour: {str(e)}")
        return None


def estimate_weight_with_gemini(
    fruit_name: str,
    gemini_data: Dict[str, Any],
    contour_info: Optional[Dict] = None,
    pixels_per_cm: float = 50.0
) -> Dict[str, Any]:
    """
    Enhanced weight estimation combining Gemini AI analysis with computer vision
    Gemini provides: quantity, weight per unit, size assessment
    CV provides: visual size validation
    """
    densities = load_fruit_densities()
    dimensions = load_fruit_dimensions()
    
    # Get Gemini's analysis
    quantity = gemini_data.get("quantity", 1)
    gemini_weight_per_unit = gemini_data.get("weight_per_unit_grams", None)
    gemini_total_weight = gemini_data.get("total_weight_grams", None)
    size_assessment = gemini_data.get("size_assessment", "medium")
    visual_cues = gemini_data.get("visual_cues", [])
    
    # Get fruit properties from database
    density = densities.get(fruit_name, 0.9)
    dim_info = dimensions.get(fruit_name, {
        "shape": "spherical",
        "avg_diameter_cm": 7.0,
        "avg_weight_grams": 150,
        "size_range": [5.0, 10.0],
        "form_factor": 0.9
    })
    
    avg_weight_db = dim_info.get("avg_weight_grams", 150)
    avg_diameter = dim_info.get("avg_diameter_cm", 7.0)
    
    # === METHOD 1: Use Gemini's direct weight estimate (primary) ===
    if gemini_total_weight and gemini_weight_per_unit:
        estimated_weight_grams = gemini_total_weight
        weight_per_unit = gemini_weight_per_unit
        
        # Apply size adjustment factor based on Gemini's assessment
        size_factors = {
            "small": 0.7,
            "medium": 1.0,
            "large": 1.4,
            "mixed": 1.0
        }
        size_factor = size_factors.get(size_assessment.lower(), 1.0)
        
        # Validate against database (sanity check)
        expected_range_min = avg_weight_db * 0.3 * quantity
        expected_range_max = avg_weight_db * 2.5 * quantity
        
        # If Gemini's estimate is way off, blend with database
        if estimated_weight_grams < expected_range_min or estimated_weight_grams > expected_range_max:
            logger.warning(f"⚠️  Gemini estimate ({estimated_weight_grams}g) outside expected range ({expected_range_min}-{expected_range_max}g)")
            # Blend: 60% Gemini, 40% database
            db_estimate = avg_weight_db * quantity * size_factor
            estimated_weight_grams = int(estimated_weight_grams * 0.6 + db_estimate * 0.4)
            logger.info(f"   Blended estimate: {estimated_weight_grams}g")
        
        estimation_method = "gemini_vision_ai"
        
    # === METHOD 2: Fallback to CV-based estimation ===
    else:
        logger.info("📏 Using CV-based estimation (Gemini data incomplete)")
        
        if contour_info:
            bbox = contour_info.get("bounding_box", {})
            width_px = bbox.get("width", 100)
            height_px = bbox.get("height", 100)
            
            width_cm = width_px / pixels_per_cm
            height_cm = height_px / pixels_per_cm
            estimated_diameter = (width_cm + height_cm) / 2
            
            size_ratio = estimated_diameter / avg_diameter
            weight_per_unit = int(avg_weight_db * (size_ratio ** 3) * dim_info.get("form_factor", 0.9))
        else:
            weight_per_unit = avg_weight_db
        
        # Apply size adjustment
        size_factors = {"small": 0.7, "medium": 1.0, "large": 1.4, "mixed": 1.0}
        size_factor = size_factors.get(size_assessment.lower(), 1.0)
        weight_per_unit = int(weight_per_unit * size_factor)
        
        estimated_weight_grams = weight_per_unit * quantity
        estimation_method = "computer_vision_fallback"
    
    # === FINAL CALCULATIONS ===
    weight_kg = estimated_weight_grams / 1000
    
    # Determine size category
    if weight_per_unit < avg_weight_db * 0.85:
        size_category = "small"
    elif weight_per_unit > avg_weight_db * 1.15:
        size_category = "large"
    else:
        size_category = "medium"
    
    # Calculate confidence based on method
    confidence_scores = {
        "gemini_vision_ai": 0.92,
        "computer_vision_fallback": 0.75
    }
    estimation_confidence = confidence_scores.get(estimation_method, 0.75)
    
    logger.info(f"⚖️  Final Weight Estimate:")
    logger.info(f"   Method: {estimation_method}")
    logger.info(f"   Quantity: {quantity} × {weight_per_unit}g = {estimated_weight_grams}g")
    logger.info(f"   Total: {weight_kg:.3f}kg")
    logger.info(f"   Confidence: {estimation_confidence*100:.0f}%")
    
    return {
        "weight_kg": round(weight_kg, 3),
        "weight_grams": round(estimated_weight_grams, 1),
        "quantity": quantity,
        "weight_per_unit_grams": round(weight_per_unit, 1),
        "size_category": size_category,
        "size_assessment": size_assessment,
        "estimation_method": estimation_method,
        "estimation_confidence": round(estimation_confidence * 100, 1),
        "visual_cues": visual_cues,
        "shape": dim_info.get("shape", "unknown"),
        "density": density,
        "form_factor": dim_info.get("form_factor", 0.9)
    }


def classify_fruit_with_gemini(pil_image: Image.Image) -> Dict[str, Any]:
    """Classify fruit using Gemini Vision API with advanced weight estimation"""
    try:
        prompt = """Analyze this fruit image in detail for a supermarket checkout system.

Respond ONLY with valid JSON (no markdown, no extra text):
{
    "fruit_name": "exact name of the fruit (e.g., 'Tomato', 'Apple Red', 'Banana')",
    "confidence": "high/medium/low",
    "color": "primary color",
    "ripeness": "ripe/unripe/overripe",
    "quantity": <number of fruits visible as integer>,
    "size_assessment": "small/medium/large/mixed",
    "estimated_weight_per_unit_grams": <estimated weight of ONE fruit in grams as integer>,
    "visual_cues": ["list of visual details that helped estimate weight, like 'appears dense', 'size comparable to tennis ball', etc."]
}

IMPORTANT for weight estimation:
- Count ALL visible fruits carefully
- Estimate size by comparing to common objects
- Consider fruit density and ripeness in weight estimate
- For small fruits (berries, grapes): estimate 5-30g each
- For medium fruits (apples, oranges): estimate 100-250g each  
- For large fruits (melons, pineapples): estimate 500-2000g each
- If multiple fruits, count them accurately"""

        response = gemini_model.generate_content([prompt, pil_image])
        response_text = response.text.strip()
        
        # Clean markdown if present
        if '```' in response_text:
            parts = response_text.split('```')
            for part in parts:
                clean_part = part.strip()
                if clean_part.startswith('json'):
                    clean_part = clean_part[4:].strip()
                if clean_part.startswith('{'):
                    response_text = clean_part
                    break
        
        result = json.loads(response_text)
        
        # Extract Gemini's analysis
        gemini_fruit_name = result.get("fruit_name", "Unknown")
        quantity = int(result.get("quantity", 1))
        weight_per_unit = int(result.get("estimated_weight_per_unit_grams", 150))
        size_assessment = result.get("size_assessment", "medium")
        visual_cues = result.get("visual_cues", [])
        
        # Calculate total weight from Gemini's assessment
        total_weight_grams = weight_per_unit * quantity
        
        # Map confidence to percentage
        confidence_map = {"high": 95.0, "medium": 75.0, "low": 55.0}
        confidence_pct = confidence_map.get(result.get("confidence", "medium").lower(), 75.0)
        
        # Match to class indices
        matched_name, class_idx, emoji = match_to_class_indices(gemini_fruit_name)
        
        logger.info(f"🍎 Gemini Analysis:")
        logger.info(f"   Fruit: '{gemini_fruit_name}' → Matched: '{matched_name}' {emoji}")
        logger.info(f"   Quantity: {quantity} fruits")
        logger.info(f"   Weight per unit: {weight_per_unit}g")
        logger.info(f"   Total weight: {total_weight_grams}g ({total_weight_grams/1000:.3f}kg)")
        logger.info(f"   Size: {size_assessment}")
        
        return {
            "fruit_name": matched_name,
            "gemini_original": gemini_fruit_name,
            "confidence": confidence_pct,
            "class_index": class_idx,
            "emoji": emoji,
            "color": result.get("color", "unknown"),
            "ripeness": result.get("ripeness", "unknown"),
            "quantity": quantity,
            "weight_per_unit_grams": weight_per_unit,
            "total_weight_grams": total_weight_grams,
            "size_assessment": size_assessment,
            "visual_cues": visual_cues,
            "top_5": []
        }
        
    except json.JSONDecodeError as je:
        logger.error(f"JSON parse error: {str(je)}")
        return {
            "fruit_name": "Unknown",
            "gemini_original": "Unknown",
            "confidence": 50.0,
            "class_index": -1,
            "emoji": "🍎",
            "color": "unknown",
            "ripeness": "unknown",
            "quantity": 1,
            "weight_per_unit_grams": 150,
            "total_weight_grams": 150,
            "size_assessment": "medium",
            "visual_cues": [],
            "top_5": []
        }
    except Exception as e:
        logger.error(f"Gemini classification error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


def classify_fruit(image: np.ndarray) -> Dict[str, Any]:
    """Main classification function using Gemini with advanced weight analysis"""
    try:
        logger.info("🔍 Starting Gemini AI classification with weight estimation...")
        
        pil_image = Image.fromarray(image)
        result = classify_fruit_with_gemini(pil_image)
        
        logger.info(f"🎯 Result: {result['fruit_name']} {result['emoji']} ({result['confidence']:.1f}%)")
        if result['quantity'] > 1:
            logger.info(f"📦 Multiple items detected: {result['quantity']} fruits")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Classification error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


def apply_kmeans_segmentation(image: np.ndarray, k: int = 4, color_space: str = "RGB", fast_mode: bool = False) -> Dict[str, Any]:
    """
    Enhanced K-means segmentation using utils.py - superior quality
    """
    try:
        original = image.copy()
        h, w = image.shape[:2]
        
        logger.info(f"🎨 Segmentation: k={k}, color_space={color_space}")
        
        # Convert color space using utils
        if color_space.upper() == "RGB":
            img_converted = image
        elif color_space.upper() == "HSV":
            img_converted = convert_color_space(image, 'HSV')
        elif color_space.upper() == "LAB":
            img_converted = convert_color_space(image, 'Lab')
        else:
            img_converted = image
        
        # Apply K-means using utils (superior algorithm)
        segmented_image, labels, inertia = apply_kmeans(img_converted, k)
        
        # Convert back to RGB if needed
        if color_space.upper() == "HSV":
            segmented_image = cv2.cvtColor(segmented_image, cv2.COLOR_HSV2RGB)
        elif color_space.upper() == "LAB":
            segmented_image = cv2.cvtColor(segmented_image, cv2.COLOR_LAB2RGB)
        
        # Create intelligent fruit mask
        labels_2d = labels.reshape((h, w))
        
        # Detect edges (background usually touches edges)
        edge_thickness = max(5, min(w, h) // 40)
        edge_mask = np.zeros((h, w), dtype=np.uint8)
        edge_mask[0:edge_thickness, :] = 1
        edge_mask[h-edge_thickness:h, :] = 1
        edge_mask[:, 0:edge_thickness] = 1
        edge_mask[:, w-edge_thickness:w] = 1
        
        # Score clusters (fruit vs background)
        cluster_scores = []
        for i in range(k):
            cluster_mask = (labels_2d == i).astype(np.uint8)
            
            # Penalize edge-touching clusters (likely background)
            edge_pixels = np.sum(cluster_mask * edge_mask)
            edge_ratio = edge_pixels / (np.sum(cluster_mask) + 1)
            
            # Reward center-positioned clusters (likely fruit)
            center_h, center_w = h // 3, w // 3
            center_region = np.zeros_like(cluster_mask)
            center_region[center_h:2*center_h, center_w:2*center_w] = 1
            center_pixels = np.sum(cluster_mask * center_region)
            center_ratio = center_pixels / (np.sum(cluster_mask) + 1)
            
            # Size score (reasonable fruit size)
            size = np.sum(cluster_mask)
            size_ratio = size / (h * w)
            size_score = 1.0 if 0.1 < size_ratio < 0.8 else 0.3
            
            # Combined score
            score = (1 - edge_ratio) * 3.0 + center_ratio * 2.0 + size_score * 2.0
            cluster_scores.append((i, score, size))
        
        # Select best clusters as fruit
        cluster_scores.sort(key=lambda x: x[1], reverse=True)
        fruit_clusters = [cluster_scores[0][0]]
        
        # Add second best if good enough
        if len(cluster_scores) > 1 and cluster_scores[1][1] > cluster_scores[0][1] * 0.6:
            fruit_clusters.append(cluster_scores[1][0])
        
        # Create fruit mask
        fruit_mask = np.zeros((h, w), dtype=np.uint8)
        for cluster_id in fruit_clusters:
            fruit_mask[labels_2d == cluster_id] = 255
        
        # Refine mask with morphology
        kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        kernel_large = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
        fruit_mask = cv2.morphologyEx(fruit_mask, cv2.MORPH_OPEN, kernel_small)
        fruit_mask = cv2.morphologyEx(fruit_mask, cv2.MORPH_CLOSE, kernel_large)
        fruit_mask = cv2.GaussianBlur(fruit_mask, (5, 5), 0)
        _, fruit_mask = cv2.threshold(fruit_mask, 127, 255, cv2.THRESH_BINARY)
        
        # Find largest connected component
        num_labels, labels_cc, stats, _ = cv2.connectedComponentsWithStats(fruit_mask, connectivity=8)
        if num_labels > 1:
            largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
            fruit_mask = np.zeros_like(fruit_mask)
            fruit_mask[labels_cc == largest_label] = 255
        
        # Create final image with mask
        fruit_mask_float = fruit_mask.astype(np.float32) / 255.0
        fruit_mask_3ch = np.stack([fruit_mask_float] * 3, axis=2)
        
        # Blend original with segmented (70% original for detail)
        blended = (original * 0.7 + segmented_image * 0.3).astype(np.uint8)
        final_image = (blended * fruit_mask_3ch).astype(np.uint8)
        
        # Add white background
        white_bg = np.ones_like(final_image) * 255
        final_image = (final_image * fruit_mask_3ch + white_bg * (1 - fruit_mask_3ch)).astype(np.uint8)
        
        fruit_area = int(np.sum(fruit_mask > 0))
        
        # Encode images
        segmented_pil = Image.fromarray(final_image)
        buffered = BytesIO()
        segmented_pil.save(buffered, format="PNG", quality=95)
        segmented_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        mask_pil = Image.fromarray(fruit_mask)
        mask_buffered = BytesIO()
        mask_pil.save(mask_buffered, format="PNG")
        mask_base64 = base64.b64encode(mask_buffered.getvalue()).decode()
        
        logger.info(f"✅ Segmentation: {fruit_area} pixels ({fruit_area/(h*w)*100:.1f}% of image)")
        
        return {
            "segmented_image": f"data:image/png;base64,{segmented_base64}",
            "fruit_mask": f"data:image/png;base64,{mask_base64}",
            "k": k,
            "color_space": color_space,
            "inertia": float(inertia),
            "cluster_centers": [],
            "fruit_mask_area_pixels": fruit_area,
            "fruit_percentage": round(fruit_area / (h * w) * 100, 2),
            "image_dimensions": {"width": w, "height": h},
            "selected_clusters": fruit_clusters,
            "processing_mode": "utils_kmeans"
        }
        
    except Exception as e:
        logger.error(f"Error in segmentation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")


# =============================================================================
# Pydantic Models
# =============================================================================

class ImageRequest(BaseModel):
    image: str
    pixels_per_cm: Optional[float] = 50.0


class SegmentationRequest(BaseModel):
    image: str
    k: Optional[int] = 4
    color_space: Optional[str] = "RGB"
    fast_mode: Optional[bool] = False  # NEW: Quick segmentation option


class ClassificationResponse(BaseModel):
    fruit_name: str
    confidence: float
    class_index: int
    emoji: str
    price_per_kg: float
    weight: Dict[str, Any]
    total_price: float
    contour: Optional[Dict[str, Any]]
    top_5: List[Dict[str, Any]]


class SegmentationResponse(BaseModel):
    segmented_image: str
    k: int
    color_space: str
    inertia: float
    cluster_centers: List[List[int]]
    fruit_mask_area_pixels: int


class FruitInfo(BaseModel):
    name: str
    price_per_kg: float
    density: float
    dimensions: Dict[str, Any]


# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/")
async def root():
    """API Health check"""
    return {
        "status": "online",
        "service": "Fruit Recognition API - SuperMarché Maroc",
        "version": "3.0.0",
        "ai_powered": True,
        "classes_loaded": len(CLASS_INDICES) if CLASS_INDICES else 0
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "ai": {
            "status": "active",
            "provider": "vision_api"
        },
        "data": {
            "classes": len(CLASS_INDICES) if CLASS_INDICES else 0,
            "prices": len(FRUIT_PRICES) if FRUIT_PRICES else 0,
            "densities": len(FRUIT_DENSITIES) if FRUIT_DENSITIES else 0,
            "dimensions": len(FRUIT_DIMENSIONS) if FRUIT_DIMENSIONS else 0
        }
    }


@app.get("/fruits")
async def get_all_fruits() -> List[FruitInfo]:
    """Get list of all fruits with prices and properties"""
    prices = load_fruit_prices()
    densities = load_fruit_densities()
    dimensions = load_fruit_dimensions()
    
    fruits = []
    for name, price in prices.items():
        fruits.append(FruitInfo(
            name=name,
            price_per_kg=price,
            density=densities.get(name, 0.9),
            dimensions=dimensions.get(name, {})
        ))
    
    return fruits


@app.get("/fruits/{fruit_name}")
async def get_fruit_info(fruit_name: str) -> FruitInfo:
    """Get info for a specific fruit"""
    prices = load_fruit_prices()
    densities = load_fruit_densities()
    dimensions = load_fruit_dimensions()
    
    if fruit_name not in prices:
        raise HTTPException(status_code=404, detail=f"Fruit '{fruit_name}' not found")
    
    return FruitInfo(
        name=fruit_name,
        price_per_kg=prices[fruit_name],
        density=densities.get(fruit_name, 0.9),
        dimensions=dimensions.get(fruit_name, {})
    )


@app.post("/classify")
async def classify_image(request: ImageRequest) -> ClassificationResponse:
    """Classify fruit from base64 image with AI-powered weight estimation"""
    try:
        image = decode_base64_image(request.image)
        
        # Classify fruit with Gemini (includes quantity and weight estimates)
        classification = classify_fruit(image)
        fruit_name = classification["fruit_name"]
        emoji = classification["emoji"]
        
        # Detect contour for visual validation
        contour_info = detect_fruit_contour(image)
        
        # Estimate weight using Gemini's analysis + CV validation
        weight_info = estimate_weight_with_gemini(
            fruit_name,
            classification,  # Pass Gemini's data
            contour_info,
            request.pixels_per_cm
        )
        
        # Get price
        prices = load_fruit_prices()
        price_per_kg = prices.get(fruit_name, 10.0)
        
        # Calculate total price
        total_price = weight_info["weight_kg"] * price_per_kg
        
        # Enhanced response with quantity info
        response_data = {
            "fruit_name": fruit_name,
            "confidence": classification["confidence"],
            "class_index": classification["class_index"],
            "emoji": emoji,
            "price_per_kg": price_per_kg,
            "weight": weight_info,
            "total_price": round(total_price, 2),
            "contour": contour_info,
            "top_5": classification.get("top_5", [])
        }
        
        # Log detailed pricing breakdown
        logger.info(f"💰 Pricing Breakdown:")
        logger.info(f"   {fruit_name} {emoji}")
        logger.info(f"   Quantity: {weight_info['quantity']} × {weight_info['weight_per_unit_grams']}g")
        logger.info(f"   Total Weight: {weight_info['weight_kg']}kg")
        logger.info(f"   Price: {price_per_kg} DH/kg")
        logger.info(f"   TOTAL: {total_price:.2f} DH")
        
        return ClassificationResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Classification endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/segment")
async def segment_image(request: SegmentationRequest) -> SegmentationResponse:
    """Apply K-means segmentation to image"""
    try:
        image = decode_base64_image(request.image)
        k = max(3, min(8, request.k or 4))
        color_space = request.color_space.upper() if request.color_space else "RGB"
        if color_space not in ["RGB", "HSV", "LAB"]:
            color_space = "RGB"
        
        result = apply_kmeans_segmentation(image, k, color_space, request.fast_mode)
        return SegmentationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Segmentation endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/classify-file")
async def classify_file(file: UploadFile = File(...)):
    """Classify fruit from uploaded file with AI weight estimation"""
    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents))
        image_rgb = np.array(image.convert("RGB"))
        
        # Classify with Gemini (includes weight estimates)
        classification = classify_fruit(image_rgb)
        fruit_name = classification["fruit_name"]
        emoji = classification["emoji"]
        
        # Detect contour
        contour_info = detect_fruit_contour(image_rgb)
        
        # Estimate weight with Gemini data
        weight_info = estimate_weight_with_gemini(fruit_name, classification, contour_info)
        
        # Get price
        prices = load_fruit_prices()
        price_per_kg = prices.get(fruit_name, 10.0)
        total_price = weight_info["weight_kg"] * price_per_kg
        
        return {
            "fruit_name": fruit_name,
            "confidence": classification["confidence"],
            "class_index": classification["class_index"],
            "emoji": emoji,
            "price_per_kg": price_per_kg,
            "weight": weight_info,
            "total_price": round(total_price, 2),
            "top_5": classification.get("top_5", [])
        }
        
    except Exception as e:
        logger.error(f"File upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Startup Event
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Load all data on startup"""
    logger.info("="*60)
    logger.info("🚀 Starting Fruit Recognition API")
    logger.info("="*60)
    
    load_class_indices()
    load_fruit_prices()
    load_fruit_densities()
    load_fruit_dimensions()
    
    logger.info("="*60)
    logger.info("✅ Startup complete!")
    logger.info("="*60)


# =============================================================================
# Main Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )