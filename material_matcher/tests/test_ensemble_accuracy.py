import os
import sys
import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.matcher import MaterialMatcher
from core.feature_extraction import FeatureExtractor
from config import FEATURE_DIM

def run_accuracy_test():
    print("Initializing MaterialMatcher for Accuracy Test...")
    matcher = MaterialMatcher()
    
    # 1. Create a "target" material vector and add it to the DB to simulate a known material
    # We bypass the normal image->vector flow here just to inject a known vector into FAISS
    target_vector = np.random.rand(FEATURE_DIM).astype(np.float32)
    norm = np.linalg.norm(target_vector)
    target_vector = target_vector / norm
    
    # Add to FAISS index (using ID 1, assuming it exists in SQLite from phase 1)
    matcher.search_engine.add_vectors(np.expand_dims(target_vector, axis=0), np.array([1], dtype=np.int64))
    print("\n[Setup] Added target material vector to local DB.")

    # 2. Simulate 3 photos taken of this material, each with some random noise (lighting, angle)
    # Instead of generating images and running them through the CNN (which is deterministic for the same image but we want to simulate physical noise),
    # we will simulate the extracted vectors directly by adding noise to the target vector.
    
    print("\n[Simulating Photo Captures]")
    np.random.seed(42) # For reproducibility
    
    noisy_vectors = []
    for i in range(3):
        # Add random noise to the target vector
        noise = np.random.normal(0, 0.2, FEATURE_DIM).astype(np.float32)
        noisy_vec = target_vector + noise
        
        # Re-normalize
        noisy_vec = noisy_vec / np.linalg.norm(noisy_vec)
        noisy_vectors.append(noisy_vec)
        print(f"  - Simulated Photo {i+1} processed.")

    # 3. Test Single Shot Accuracy
    print("\n--- 1. Single Shot Search ---")
    single_scores = []
    for i, vec in enumerate(noisy_vectors):
        results = matcher.search_engine.search_similar(vec, top_k=1)
        score = results[0]['similarity_score'] if results else 0
        single_scores.append(score)
        print(f"  Photo {i+1} Similarity Score: {score:.4f}")
    
    avg_single_score = np.mean(single_scores)
    print(f"  => Average Single Shot Score: {avg_single_score:.4f}")

    # 4. Test Ensemble Accuracy
    print("\n--- 2. Multi-Shot Ensemble Search ---")
    # Average the noisy vectors
    ensemble_vector = np.mean(noisy_vectors, axis=0)
    # Re-normalize
    ensemble_vector = ensemble_vector / np.linalg.norm(ensemble_vector)
    
    ensemble_results = matcher.search_engine.search_similar(ensemble_vector, top_k=1)
    ensemble_score = ensemble_results[0]['similarity_score'] if ensemble_results else 0
    print(f"  => Ensemble Similarity Score: {ensemble_score:.4f}")
    
    # 5. Conclusion
    improvement = (ensemble_score - avg_single_score) / avg_single_score * 100
    print(f"\n[Conclusion] Ensemble search improved accuracy by {improvement:.2f}% compared to average single shot.")

if __name__ == "__main__":
    run_accuracy_test()
