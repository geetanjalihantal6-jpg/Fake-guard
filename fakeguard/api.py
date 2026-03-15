from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)

model = joblib.load("fake_account_model.pkl")
imputer = joblib.load("feature_imputer.pkl")
platform_encoder = joblib.load("platform_encoder.pkl")

FEATURES = [
    "platform", "has_profile_pic", "bio_length", "username_randomness",
    "followers", "following", "follower_following_ratio",
    "account_age_days", "posts", "posts_per_day",
    "caption_similarity_score", "content_similarity_score",
    "follow_unfollow_rate", "spam_comments_rate",
    "generic_comment_rate", "suspicious_links_in_bio", "verified",
]

@app.post("/api/analyze")
def analyze():
    data = request.get_json()
    platform = data.get("platform", "Instagram")
    features = data.get("features")

    # Example: if features come missing, you could also estimate them
    if features is None:
        return jsonify({"status": "error", "message": "features missing"}), 400

    # Build one-row DataFrame
    row = {k: features.get(k) for k in FEATURES}
    row["platform"] = platform_encoder.transform([platform])[0]

    X = pd.DataFrame([row])
    X_imputed = pd.DataFrame(imputer.transform(X), columns=FEATURES)
    prob_fake = model.predict_proba(X_imputed)[0, 1]
    pred = int(prob_fake >= 0.5)

    return jsonify({
        "status": "success",
        "prediction": "Fake Account" if pred == 1 else "Genuine Account",
        "probability_fake": float(prob_fake),
    })

if __name__ == "__main__":
    app.run(debug=True)
