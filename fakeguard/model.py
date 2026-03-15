import pandas as pd
import numpy as np 

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)
from sklearn.preprocessing import LabelEncoder
from sklearn.impute import SimpleImputer
import joblib

# 1. Load dataset
# Use the new CSV with is_fake column
data = pd.read_csv("/Users/dino/fakeguard/fusers_with_is_fake.csv")
print("Shape:", data.shape)
print("Columns:", data.columns.tolist())
print("Missing values:\n", data.isnull().sum())

# 2. Separate features/target
X = data.drop("is_fake", axis=1)
y = data["is_fake"]
# 3. Encode 'platform' (categorical) and save encoder
if "platform" in X.columns and X["platform"].dtype == "object":
    platform_encoder = LabelEncoder()
    X["platform"] = platform_encoder.fit_transform(X["platform"])
    joblib.dump(platform_encoder, "platform_encoder.pkl")
    print("Saved platform encoder as platform_encoder.pkl")
else:
    platform_encoder = None

# 4. Handle any missing values (simple median imputation)
imputer = SimpleImputer(strategy="median")
X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=X.columns)
joblib.dump(imputer, "feature_imputer.pkl")
print("Saved feature imputer as feature_imputer.pkl")

# 5. Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X_imputed, y, test_size=0.2, random_state=42, stratify=y
)

# Helper to evaluate models
def evaluate_model(name, model, X_test, y_test):
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    print(f"\n{name} performance")
    print("-" * 30)
    print("Accuracy :", acc)
    print("Precision:", prec)
    print("Recall   :", rec)
    print("F1-score :", f1)
    print("Confusion matrix:\n", confusion_matrix(y_test, y_pred))
    return {"name": name, "model": model, "acc": acc, "f1": f1}

models = []

# 6. Logistic Regression
lr_model = LogisticRegression(max_iter=2000)
lr_model.fit(X_train, y_train)
models.append(evaluate_model("Logistic Regression", lr_model, X_test, y_test))

# 7. Decision Tree
dt_model = DecisionTreeClassifier(
    random_state=42,
    max_depth=8,
    min_samples_split=20,
    min_samples_leaf=10,
)
dt_model.fit(X_train, y_train)
models.append(evaluate_model("Decision Tree", dt_model, X_test, y_test))

# 8. Random Forest
rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=20,
    min_samples_leaf=10,
    random_state=42,
)
rf_model.fit(X_train, y_train)
models.append(evaluate_model("Random Forest", rf_model, X_test, y_test))

print("\nDetailed classification report for best model candidate (Random Forest):")
print(classification_report(y_test, rf_model.predict(X_test)))

# 9. Select best model by F1 (or accuracy)
best = max(models, key=lambda m: m["f1"])
print("\nBest model:", best["name"], "with F1 =", best["f1"])

# 10. Save best model
joblib.dump(best["model"], "fake_account_model.pkl")
print("Saved best model to fake_account_model.pkl")
