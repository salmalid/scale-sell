import cv2
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, davies_bouldin_score
import os

def load_image(image_path):
    """Loads an image and converts it to RGB."""
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Image not found at {image_path}")
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

def convert_color_space(image, color_space='RGB'):
    """Converts image to specified color space."""
    if color_space == 'RGB':
        return image
    elif color_space == 'HSV':
        return cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
    elif color_space == 'Lab':
        return cv2.cvtColor(image, cv2.COLOR_RGB2Lab)
    else:
        raise ValueError("Unsupported color space. Use 'RGB', 'HSV', or 'Lab'.")

def apply_kmeans(image, k):
    """Applies K-means clustering to the image."""
    pixel_values = image.reshape((-1, 3))
    pixel_values = np.float32(pixel_values)
    
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(pixel_values)
    centers = np.uint8(kmeans.cluster_centers_)
    
    segmented_data = centers[labels.flatten()]
    segmented_image = segmented_data.reshape(image.shape)
    
    return segmented_image, labels, kmeans.inertia_

def calculate_metrics(image, labels, k_value):
    """Calculates clustering metrics."""
    pixel_values = image.reshape((-1, 3))
    
    # Silhouette score is computationally expensive for all pixels.
    # We will compute it on a sample if the image is large.
    if pixel_values.shape[0] > 10000:
        indices = np.random.choice(pixel_values.shape[0], 10000, replace=False)
        sample_pixels = pixel_values[indices]
        sample_labels = labels[indices]
    else:
        sample_pixels = pixel_values
        sample_labels = labels
        
    sil_score = silhouette_score(sample_pixels, sample_labels)
    db_score = davies_bouldin_score(pixel_values, labels)
    
    return sil_score, db_score

def visualize_comparison(original, segmented_images, titles, save_path=None):
    """Visualizes original and segmented images."""
    n = len(segmented_images) + 1
    plt.figure(figsize=(15, 5))
    
    plt.subplot(1, n, 1)
    plt.imshow(original)
    plt.title("Original")
    plt.axis('off')
    
    for i, (seg, title) in enumerate(zip(segmented_images, titles)):
        plt.subplot(1, n, i + 2)
        plt.imshow(seg)
        plt.title(title)
        plt.axis('off')
        
    plt.tight_layout()
    if save_path:
        plt.savefig(save_path)
        plt.close()
    else:
        plt.show()
