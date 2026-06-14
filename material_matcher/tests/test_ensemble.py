import os
import sys
import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.matcher import MaterialMatcher

def create_dummy_images():
    # Create 3 slightly different dummy images of the same "material"
    paths = []
    for i in range(3):
        # Base color
        img = np.full((600, 400, 3), (100 + i*5, 150 - i*5, 150 + i*2), dtype=np.uint8)
        # Add white reference box
        cv2.rectangle(img, (50, 50), (200, 200), (200, 230, 240), -1)
        # Add some random noise to simulate different angles/lighting
        noise = np.random.randint(-10, 10, img.shape, dtype=np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        
        path = f"/home/ubuntu/material_matcher/tests/dummy_shot_{i}.jpg"
        cv2.imwrite(path, img)
        paths.append(path)
    return paths

def run_test():
    print("Initializing MaterialMatcher...")
    matcher = MaterialMatcher()
    
    print("\nCreating dummy images...")
    img_paths = create_dummy_images()
    
    print("\n--- 1. Single Shot Search Test ---")
    single_result = matcher.search_by_image(img_paths[0], top_k=1)
    if single_result["success"]:
        score = single_result['results'][0]['similarity_score'] if single_result['results'] else 0
        print(f"Single shot similarity score: {score:.4f}")
    else:
        print(f"Single shot failed: {single_result['error']}")

    print("\n--- 2. Multi-Shot Ensemble Search Test ---")
    ensemble_result = matcher.search_by_images(img_paths, top_k=1)
    if ensemble_result["success"]:
        score = ensemble_result['results'][0]['similarity_score'] if ensemble_result['results'] else 0
        print(f"Ensemble search message: {ensemble_result['message']}")
        print(f"Ensemble shot similarity score: {score:.4f}")
    else:
        print(f"Ensemble search failed: {ensemble_result['error']}")

if __name__ == "__main__":
    run_test()
