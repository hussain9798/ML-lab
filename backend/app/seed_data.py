import datetime
import logging
import bcrypt
from app.db import get_db
from app.config import Config

logger = logging.getLogger(__name__)

def seed_database():
    """Initializes seed users, algorithms, documentation, and test cases."""
    db = get_db()
    now = datetime.datetime.utcnow().isoformat()

    # 1. Seed Users
    if db.users.count_documents({}) == 0:
        logger.info("Seeding initial users...")
        salt = bcrypt.gensalt()
        admin_hash = bcrypt.hashpw("Admin123!".encode('utf-8'), salt).decode('utf-8')
        student_hash = bcrypt.hashpw("Student123!".encode('utf-8'), salt).decode('utf-8')

        db.users.insert_many([
            {
                'name': 'System Administrator',
                'email': Config.ADMIN_EMAIL,
                'password_hash': admin_hash,
                'role': 'admin',
                'created_at': now,
                'updated_at': now
            },
            {
                'name': 'Alex Student',
                'email': 'student@mllab.com',
                'password_hash': student_hash,
                'role': 'user',
                'created_at': now,
                'updated_at': now
            }
        ])
        logger.info("Created the configured admin account and student@mllab.com.")
    else:
        # Migrate the original placeholder admin address to the configured
        # real inbox so OTP delivery does not target a nonexistent mailbox.
        configured_admin = db.users.find_one({'email': Config.ADMIN_EMAIL})
        placeholder_admin = db.users.find_one({
            'role': 'admin',
            'email': 'admin@mllab.com'
        })
        if not configured_admin and placeholder_admin and Config.ADMIN_EMAIL != 'admin@mllab.com':
            db.users.update_one(
                {'_id': placeholder_admin['_id']},
                {'$set': {
                    'email': Config.ADMIN_EMAIL,
                    'updated_at': now
                }}
            )
            logger.info("Migrated the seeded admin account to the configured admin email.")

    # 2. Seed Algorithms
    if db.algorithms.count_documents({}) == 0:
        logger.info("Seeding ML algorithms catalog...")
        algorithms = [
            {
                'name': 'Linear Regression',
                'slug': 'linear-regression',
                'category': 'Regression',
                'difficulty': 'Beginner',
                'description': 'Models the relationship between a scalar response and one or more explanatory variables using Ordinary Least Squares or Gradient Descent.',
                'status': 'published',
                'scratch_enabled': True,
                'builtin_enabled': True,
                'allowed_libraries': ['numpy', 'pandas', 'scikit-learn', 'matplotlib'],
                'sample_dataset': 'house_prices',
                'validation_tolerance': 0.05,
                'metrics': ['r2_score', 'mse', 'rmse', 'mae'],
                'starter_code': {
                    'scratch': """import numpy as np

class MyLinearRegression:
    \"\"\"
    Linear Regression implemented from scratch using Ordinary Least Squares (Closed Form)
    or Gradient Descent.
    \"\"\"
    def __init__(self, learning_rate=0.01, epochs=1000):
        self.learning_rate = learning_rate
        self.epochs = epochs
        self.weights = None
        self.bias = None

    def fit(self, X, y):
        # Convert inputs to numpy arrays
        X = np.array(X, dtype=np.float64)
        y = np.array(y, dtype=np.float64).reshape(-1, 1)
        
        # Closed-form Ordinary Least Squares (Normal Equation):
        # w = (X^T * X)^(-1) * X^T * y
        X_b = np.c_[np.ones((X.shape[0], 1)), X]  # Add bias column
        theta = np.linalg.pinv(X_b.T @ X_b) @ X_b.T @ y
        
        self.bias = theta[0, 0]
        self.weights = theta[1:, 0]
        return self

    def predict(self, X):
        X = np.array(X, dtype=np.float64)
        return X @ self.weights + self.bias
""",
                    'builtin': """from sklearn.linear_model import LinearRegression

# Initialize and train Scikit-learn model
model = LinearRegression()
model.fit(X_train, y_train)

# Predict test set
predictions = model.predict(X_test)
print("Coefficients:", model.coef_)
print("Intercept:", model.intercept_)
"""
                },
                'created_at': now,
                'updated_at': now
            },
            {
                'name': 'Polynomial Regression',
                'slug': 'polynomial-regression',
                'category': 'Regression',
                'difficulty': 'Intermediate',
                'description': 'Extends linear models by constructing polynomial feature combinations to capture non-linear continuous relationships.',
                'status': 'published',
                'scratch_enabled': True,
                'builtin_enabled': True,
                'allowed_libraries': ['numpy', 'pandas', 'scikit-learn'],
                'sample_dataset': 'house_prices',
                'validation_tolerance': 0.06,
                'metrics': ['r2_score', 'mse', 'rmse'],
                'starter_code': {
                    'scratch': """import numpy as np

class MyPolynomialRegression:
    def __init__(self, degree=2):
        self.degree = degree
        self.weights = None
        self.bias = None

    def _transform_features(self, X):
        # Generate powers up to specified degree
        X_poly = [X]
        for d in range(2, self.degree + 1):
            X_poly.append(X ** d)
        return np.hstack(X_poly)

    def fit(self, X, y):
        X = np.array(X, dtype=np.float64)
        y = np.array(y, dtype=np.float64).reshape(-1, 1)
        
        X_poly = self._transform_features(X)
        X_b = np.c_[np.ones((X_poly.shape[0], 1)), X_poly]
        theta = np.linalg.pinv(X_b.T @ X_b) @ X_b.T @ y
        
        self.bias = theta[0, 0]
        self.weights = theta[1:, 0]
        return self

    def predict(self, X):
        X = np.array(X, dtype=np.float64)
        X_poly = self._transform_features(X)
        return X_poly @ self.weights + self.bias
""",
                    'builtin': """from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import make_pipeline

model = make_pipeline(PolynomialFeatures(degree=2), LinearRegression())
model.fit(X_train, y_train)
predictions = model.predict(X_test)
"""
                },
                'created_at': now,
                'updated_at': now
            },
            {
                'name': 'Logistic Regression',
                'slug': 'logistic-regression',
                'category': 'Classification',
                'difficulty': 'Beginner',
                'description': 'Estimates class probabilities using the Sigmoid (logistic) activation function and binary cross-entropy loss optimization.',
                'status': 'published',
                'scratch_enabled': True,
                'builtin_enabled': True,
                'allowed_libraries': ['numpy', 'pandas', 'scikit-learn'],
                'sample_dataset': 'churn',
                'validation_tolerance': 0.08,
                'metrics': ['accuracy', 'precision', 'recall', 'f1_score'],
                'starter_code': {
                    'scratch': """import numpy as np

class MyLogisticRegression:
    def __init__(self, learning_rate=0.1, epochs=300):
        self.lr = learning_rate
        self.epochs = epochs
        self.weights = None
        self.bias = 0.0

    def _sigmoid(self, z):
        # Numerically stable sigmoid function
        return np.where(z >= 0, 
                        1 / (1 + np.exp(-z)), 
                        np.exp(z) / (1 + np.exp(z)))

    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0.0

        # Gradient Descent optimization
        for _ in range(self.epochs):
            linear_model = np.dot(X, self.weights) + self.bias
            y_predicted = self._sigmoid(linear_model)

            dw = (1 / n_samples) * np.dot(X.T, (y_predicted - y))
            db = (1 / n_samples) * np.sum(y_predicted - y)

            self.weights -= self.lr * dw
            self.bias -= self.lr * db
        return self

    def predict(self, X):
        linear_model = np.dot(X, self.weights) + self.bias
        y_predicted = self._sigmoid(linear_model)
        return (y_predicted >= 0.5).astype(int)
""",
                    'builtin': """from sklearn.linear_model import LogisticRegression

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
"""
                },
                'created_at': now,
                'updated_at': now
            },
            {
                'name': 'K-Nearest Neighbors (KNN)',
                'slug': 'knn',
                'category': 'Classification',
                'difficulty': 'Beginner',
                'description': 'Instance-based lazy learning algorithm classifying queries based on majority vote of the k nearest geometric points in Euclidean feature space.',
                'status': 'published',
                'scratch_enabled': True,
                'builtin_enabled': True,
                'allowed_libraries': ['numpy', 'pandas', 'scikit-learn'],
                'sample_dataset': 'iris',
                'validation_tolerance': 0.08,
                'metrics': ['accuracy', 'precision', 'recall', 'f1_score'],
                'starter_code': {
                    'scratch': """import numpy as np
from collections import Counter

class MyKNN:
    def __init__(self, k=3):
        self.k = k
        self.X_train = None
        self.y_train = None

    def fit(self, X, y):
        self.X_train = np.array(X)
        self.y_train = np.array(y)
        return self

    def predict(self, X):
        X = np.array(X)
        return np.array([self._predict_single(x) for x in X])

    def _predict_single(self, x):
        # Compute Euclidean distance to all training samples
        distances = np.linalg.norm(self.X_train - x, axis=1)
        # Find k nearest indices
        k_indices = np.argsort(distances)[:self.k]
        k_nearest_labels = self.y_train[k_indices]
        # Return most common class label
        most_common = Counter(k_nearest_labels).most_common(1)
        return most_common[0][0]
""",
                    'builtin': """from sklearn.neighbors import KNeighborsClassifier

model = KNeighborsClassifier(n_neighbors=3)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
"""
                },
                'created_at': now,
                'updated_at': now
            },
            {
                'name': 'Decision Tree',
                'slug': 'decision-tree',
                'category': 'Classification',
                'difficulty': 'Intermediate',
                'description': 'Non-parametric supervised model that partitions feature space into homogenous leaf regions by maximizing Information Gain or Gini impurity reduction.',
                'status': 'published',
                'scratch_enabled': True,
                'builtin_enabled': True,
                'allowed_libraries': ['numpy', 'pandas', 'scikit-learn'],
                'sample_dataset': 'iris',
                'validation_tolerance': 0.10,
                'metrics': ['accuracy', 'precision', 'recall', 'f1_score'],
                'starter_code': {
                    'scratch': """import numpy as np

class Node:
    def __init__(self, feature=None, threshold=None, left=None, right=None, *, value=None):
        self.feature = feature
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value

    @property
    def is_leaf(self):
        return self.value is not None


class MyDecisionTree:
    def __init__(self, max_depth=5, min_samples_split=2):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.root = None

    def fit(self, X, y):
        self.root = self._grow_tree(np.array(X), np.array(y))
        return self

    def _gini(self, y):
        counts = np.bincount(y)
        probs = counts / len(y)
        return 1.0 - np.sum(probs ** 2)

    def _best_split(self, X, y):
        best_gain = -1
        split_feat, split_thresh = None, None
        current_gini = self._gini(y)

        for feat in range(X.shape[1]):
            thresholds = np.unique(X[:, feat])
            for thresh in thresholds:
                left_mask = X[:, feat] <= thresh
                right_mask = ~left_mask
                if np.sum(left_mask) == 0 or np.sum(right_mask) == 0:
                    continue

                w_left = np.sum(left_mask) / len(y)
                w_right = 1.0 - w_left
                child_gini = w_left * self._gini(y[left_mask]) + w_right * self._gini(y[right_mask])
                gain = current_gini - child_gini

                if gain > best_gain:
                    best_gain = gain
                    split_feat = feat
                    split_thresh = thresh

        return split_feat, split_thresh

    def _grow_tree(self, X, y, depth=0):
        n_samples = len(y)
        n_labels = len(np.unique(y))

        if depth >= self.max_depth or n_labels == 1 or n_samples < self.min_samples_split:
            leaf_value = np.bincount(y).argmax()
            return Node(value=leaf_value)

        feat, thresh = self._best_split(X, y)
        if feat is None:
            return Node(value=np.bincount(y).argmax())

        left_mask = X[:, feat] <= thresh
        left = self._grow_tree(X[left_mask], y[left_mask], depth + 1)
        right = self._grow_tree(X[~left_mask], y[~left_mask], depth + 1)
        return Node(feature=feat, threshold=thresh, left=left, right=right)

    def predict(self, X):
        return np.array([self._traverse_tree(x, self.root) for x in np.array(X)])

    def _traverse_tree(self, x, node):
        if node.is_leaf:
            return node.value
        if x[node.feature] <= node.threshold:
            return self._traverse_tree(x, node.left)
        return self._traverse_tree(x, node.right)
""",
                    'builtin': """from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(max_depth=5, random_state=42)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
"""
                },
                'created_at': now,
                'updated_at': now
            },
            {
                'name': 'Random Forest',
                'slug': 'random-forest',
                'category': 'Classification',
                'difficulty': 'Advanced',
                'description': 'Ensemble meta-estimator that trains multiple randomized decision tree classifiers on bootstrap subsets and aggregates predictions via majority voting.',
                'status': 'published',
                'scratch_enabled': True,
                'builtin_enabled': True,
                'allowed_libraries': ['numpy', 'pandas', 'scikit-learn'],
                'sample_dataset': 'iris',
                'validation_tolerance': 0.10,
                'metrics': ['accuracy', 'precision', 'recall', 'f1_score'],
                'starter_code': {
                    'scratch': """import numpy as np
from sklearn.tree import DecisionTreeClassifier

class MyRandomForest:
    def __init__(self, n_estimators=10, max_depth=5):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.trees = []

    def fit(self, X, y):
        self.trees = []
        n_samples = len(X)
        for _ in range(self.n_estimators):
            # Bootstrap sampling
            indices = np.random.choice(n_samples, size=n_samples, replace=True)
            tree = DecisionTreeClassifier(max_depth=self.max_depth, max_features="sqrt", random_state=None)
            tree.fit(X[indices], y[indices])
            self.trees.append(tree)
        return self

    def predict(self, X):
        tree_preds = np.array([tree.predict(X) for tree in self.trees])
        # Majority voting across trees
        y_pred = [np.bincount(tree_preds[:, i]).argmax() for i in range(X.shape[0])]
        return np.array(y_pred)
""",
                    'builtin': """from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=20, max_depth=5, random_state=42)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
"""
                },
                'created_at': now,
                'updated_at': now
            },
            {
                'name': 'Support Vector Machine (SVM)',
                'slug': 'svm',
                'category': 'Classification',
                'difficulty': 'Intermediate',
                'description': 'Constructs optimal hyperplanes maximizing the geometric margin between separable classes, minimizing hinge loss with L2 regularization.',
                'status': 'published',
                'scratch_enabled': True,
                'builtin_enabled': True,
                'allowed_libraries': ['numpy', 'pandas', 'scikit-learn'],
                'sample_dataset': 'iris',
                'validation_tolerance': 0.10,
                'metrics': ['accuracy', 'precision', 'recall', 'f1_score'],
                'starter_code': {
                    'scratch': """import numpy as np

class MySVM:
    def __init__(self, learning_rate=0.001, lambda_param=0.01, epochs=300):
        self.lr = learning_rate
        self.lambda_param = lambda_param
        self.epochs = epochs
        self.w = None
        self.b = 0.0

    def fit(self, X, y):
        # Convert classes to -1 and +1 for SVM formulation
        unique_labels = np.unique(y)
        self.class_map = {unique_labels[0]: -1, unique_labels[-1]: 1}
        self.reverse_map = {-1: unique_labels[0], 1: unique_labels[-1]}
        
        y_binary = np.array([self.class_map.get(label, 1) for label in y])
        n_samples, n_features = X.shape
        self.w = np.zeros(n_features)
        self.b = 0.0

        for _ in range(self.epochs):
            for idx, x_i in enumerate(X):
                condition = y_binary[idx] * (np.dot(x_i, self.w) - self.b) >= 1
                if condition:
                    self.w -= self.lr * (2 * self.lambda_param * self.w)
                else:
                    self.w -= self.lr * (2 * self.lambda_param * self.w - np.dot(x_i, y_binary[idx]))
                    self.b -= self.lr * y_binary[idx]
        return self

    def predict(self, X):
        approx = np.dot(X, self.w) - self.b
        preds = np.sign(approx)
        preds[preds == 0] = 1
        return np.array([self.reverse_map.get(p, 1) for p in preds])
""",
                    'builtin': """from sklearn.svm import SVC

model = SVC(kernel='linear')
model.fit(X_train, y_train)
predictions = model.predict(X_test)
"""
                },
                'created_at': now,
                'updated_at': now
            },
            {
                'name': 'Naive Bayes',
                'slug': 'naive-bayes',
                'category': 'Classification',
                'difficulty': 'Beginner',
                'description': 'Probabilistic classifier applying Bayes theorem under the strong (naive) independence assumption between every pair of features given the class label.',
                'status': 'published',
                'scratch_enabled': True,
                'builtin_enabled': True,
                'allowed_libraries': ['numpy', 'pandas', 'scikit-learn'],
                'sample_dataset': 'iris',
                'validation_tolerance': 0.10,
                'metrics': ['accuracy', 'precision', 'recall', 'f1_score'],
                'starter_code': {
                    'scratch': """import numpy as np

class MyNaiveBayes:
    def __init__(self):
        self.classes = None
        self.mean = {}
        self.var = {}
        self.priors = {}

    def fit(self, X, y):
        X = np.array(X)
        y = np.array(y)
        self.classes = np.unique(y)

        for c in self.classes:
            X_c = X[y == c]
            self.mean[c] = np.mean(X_c, axis=0)
            self.var[c] = np.var(X_c, axis=0) + 1e-9
            self.priors[c] = X_c.shape[0] / float(X.shape[0])
        return self

    def _pdf(self, class_idx, x):
        mean = self.mean[class_idx]
        var = self.var[class_idx]
        numerator = np.exp(-((x - mean) ** 2) / (2 * var))
        denominator = np.sqrt(2 * np.pi * var)
        return numerator / denominator

    def predict(self, X):
        X = np.array(X)
        return np.array([self._predict_single(x) for x in X])

    def _predict_single(self, x):
        posteriors = []
        for c in self.classes:
            prior = np.log(self.priors[c])
            posterior = np.sum(np.log(self._pdf(c, x)))
            posteriors.append(prior + posterior)
        return self.classes[np.argmax(posteriors)]
""",
                    'builtin': """from sklearn.naive_bayes import GaussianNB

model = GaussianNB()
model.fit(X_train, y_train)
predictions = model.predict(X_test)
"""
                },
                'created_at': now,
                'updated_at': now
            },
            {
                'name': 'K-Means Clustering',
                'slug': 'k-means',
                'category': 'Clustering',
                'difficulty': 'Beginner',
                'description': 'Iteratively partitions unlabelled observations into k clusters by assigning each observation to the nearest cluster centroid, minimizing within-cluster variance.',
                'status': 'published',
                'scratch_enabled': True,
                'builtin_enabled': True,
                'allowed_libraries': ['numpy', 'pandas', 'scikit-learn'],
                'sample_dataset': 'customer_blobs',
                'validation_tolerance': 0.15,
                'metrics': ['inertia', 'n_clusters'],
                'starter_code': {
                    'scratch': """import numpy as np

class MyKMeans:
    def __init__(self, k=3, max_iters=100):
        self.k = k
        self.max_iters = max_iters
        self.centroids = None

    def fit(self, X):
        X = np.array(X)
        np.random.seed(42)
        # Random initial centroids
        random_sample_idxs = np.random.choice(len(X), self.k, replace=False)
        self.centroids = X[random_sample_idxs]

        for _ in range(self.max_iters):
            # Cluster assignment step
            clusters = self._create_clusters(X)
            
            # Centroid update step
            old_centroids = self.centroids.copy()
            self.centroids = self._update_centroids(X, clusters)

            # Convergence check
            diff = self.centroids - old_centroids
            if not diff.any():
                break
        return self

    def predict(self, X):
        X = np.array(X)
        distances = np.array([np.linalg.norm(X - c, axis=1) for c in self.centroids])
        return np.argmin(distances, axis=0)

    def _create_clusters(self, X):
        distances = np.array([np.linalg.norm(X - c, axis=1) for c in self.centroids])
        return np.argmin(distances, axis=0)

    def _update_centroids(self, X, clusters):
        centroids = np.zeros((self.k, X.shape[1]))
        for cluster_idx in range(self.k):
            cluster_points = X[clusters == cluster_idx]
            if len(cluster_points) > 0:
                centroids[cluster_idx] = np.mean(cluster_points, axis=0)
            else:
                centroids[cluster_idx] = self.centroids[cluster_idx]
        return centroids
""",
                    'builtin': """from sklearn.cluster import KMeans

model = KMeans(n_clusters=3, random_state=42, n_init=10)
model.fit(X_train)
predictions = model.predict(X_test)
print("Inertia:", model.inertia_)
print("Centroids:", model.cluster_centers_)
"""
                },
                'created_at': now,
                'updated_at': now
            }
        ]

        db.algorithms.insert_many(algorithms)
        logger.info(f"Seeded {len(algorithms)} algorithms.")

    # 3. Seed Comprehensive Documentation
    if db.documentation.count_documents({}) == 0:
        logger.info("Seeding comprehensive algorithm documentation...")
        docs = [
            {
                'title': 'Linear Regression',
                'algorithm_slug': 'linear-regression',
                'category': 'Regression',
                'difficulty': 'Beginner',
                'reading_time_min': 8,
                'status': 'published',
                'summary': 'The foundational supervised algorithm for predicting continuous target values.',
                'intuition': 'Imagine drawing a straight trendline through a cloud of scatter points so that the vertical distances from each point to the line are as small as possible.',
                'content': """# Linear Regression

Linear Regression is the fundamental baseline model for supervised regression tasks. It models the relationship between a continuous dependent variable $y$ and one or more independent predictor features $X$.

---

## 1. Mathematical Formulation

The linear hypothesis is expressed as:

$$\\hat{y} = w^T x + b = w_1 x_1 + w_2 x_2 + \\dots + w_n x_n + b$$

Where:
- $w$ is the parameter weight vector (slope coefficients).
- $x$ is the feature vector.
- $b$ is the bias (intercept).
- $\\hat{y}$ is the predicted scalar output.

### The Cost Function: Mean Squared Error (MSE)
We quantify prediction error using the Mean Squared Error loss function $J(w, b)$:

$$J(w, b) = \\frac{1}{2m} \\sum_{i=1}^{m} (\\hat{y}^{(i)} - y^{(i)})^2$$

Where $m$ is the total number of training instances.

### Optimization Methods

1. **Closed-Form Solution (Normal Equation)**:
   By setting the gradient $\\nabla_w J = 0$, we solve directly:
   $$\\theta = (X^T X)^{-1} X^T y$$

2. **Gradient Descent**:
   We iteratively adjust parameters in the opposite direction of the gradient:
   $$w := w - \\alpha \\frac{1}{m} X^T (\\hat{y} - y)$$
   $$b := b - \\alpha \\frac{1}{m} \\sum_{i=1}^m (\\hat{y}^{(i)} - y^{(i)})$$
   Where $\\alpha$ represents the learning rate.

---

## 2. Evaluation Metrics

- **$R^2$ Score (Coefficient of Determination)**:
  $$R^2 = 1 - \\frac{\\sum (y_i - \\hat{y}_i)^2}{\\sum (y_i - \\bar{y})^2}$$
  Measures the proportion of variance explained by the model ($1.0$ is perfect).
- **Mean Absolute Error (MAE)**: $\\frac{1}{m} \\sum |y_i - \\hat{y}_i|$
- **Root Mean Squared Error (RMSE)**: $\\sqrt{\\text{MSE}}$

---

## 3. Advantages & Limitations

### Advantages
- Computationally efficient to train and evaluate.
- Highly interpretable coefficients representing direct feature importance.
- Serves as the benchmark baseline for all regression tasks.

### Limitations
- Assumes strict linear relationship between features and target.
- Highly vulnerable to extreme outliers.
- Prone to multicollinearity when predictor features are correlated.

---

## 4. Technical Interview Questions

**Q1: What happens if $X^T X$ is not invertible in the Normal Equation?**  
*Answer*: This occurs when features are collinear (redundant) or when $m < n$ (more features than data samples). In practice, we compute the Moore-Penrose pseudoinverse using SVD (`np.linalg.pinv`) or apply L2 regularization (Ridge Regression).

**Q2: What are the Gauss-Markov assumptions of Ordinary Least Squares?**  
*Answer*: Linearity, exogeneity ($E[\\epsilon|X] = 0$), homoscedasticity (constant variance of residuals), and no autocorrelation in residuals.
"""
            },
            {
                'title': 'Logistic Regression',
                'algorithm_slug': 'logistic-regression',
                'category': 'Classification',
                'difficulty': 'Beginner',
                'reading_time_min': 10,
                'status': 'published',
                'summary': 'The workhorse classification algorithm mapping linear outputs to class probabilities.',
                'intuition': 'Instead of predicting unbounded numbers, Logistic Regression wraps a linear equation in an S-shaped sigmoid curve to output probabilities between 0% and 100%.',
                'content': """# Logistic Regression

Logistic Regression is the foundational supervised model for binary and multinomial classification.

---

## 1. Mathematical Formulation

### The Sigmoid Activation Function
To transform linear continuous real outputs into valid probability bounds $[0, 1]$, we apply the logistic function:

$$\\sigma(z) = \\frac{1}{1 + e^{-z}}$$

Where $z = w^T x + b$.

### Binary Cross-Entropy Loss (Log Loss)
Because Mean Squared Error is non-convex when combined with the Sigmoid function, we use Binary Cross-Entropy loss:

$$J(w, b) = -\\frac{1}{m} \\sum_{i=1}^m \\left[ y^{(i)} \\log(\\hat{y}^{(i)}) + (1 - y^{(i)}) \\log(1 - \\hat{y}^{(i)}) \\right]$$

### Gradient Computation
The gradient of Log Loss with respect to weight $w_j$ yields an elegant formulation:

$$\\frac{\\partial J}{\\partial w_j} = \\frac{1}{m} \\sum_{i=1}^m (\\hat{y}^{(i)} - y^{(i)}) x_j^{(i)}$$

---

## 2. Evaluation Metrics

- **Accuracy**: $\\frac{TP + TN}{TP + TN + FP + FN}$
- **Precision**: $\\frac{TP}{TP + FP}$
- **Recall**: $\\frac{TP}{TP + FN}$
- **F1 Score**: $2 \\times \\frac{\\text{Precision} \\times \\text{Recall}}{\\text{Precision} + \\text{Recall}}$

---

## 3. Key Interview Questions

**Q1: Why do we use Log Loss instead of MSE for Logistic Regression?**  
*Answer*: Applying MSE to the Sigmoid function results in a non-convex cost surface with numerous local minima, preventing Gradient Descent from finding the global optimum. Log Loss guarantees convexity.
"""
            },
            {
                'title': 'K-Nearest Neighbors (KNN)',
                'algorithm_slug': 'knn',
                'category': 'Classification',
                'difficulty': 'Beginner',
                'reading_time_min': 7,
                'status': 'published',
                'summary': 'Non-parametric, instance-based lazy learning algorithm.',
                'intuition': 'Birds of a feather flock together. To classify an unknown point, find its $k$ closest neighbors and let them vote.',
                'content': """# K-Nearest Neighbors (KNN)

KNN is an intuitive instance-based algorithm that memorizes training observations during fit and performs geometric distance computations during inference.

---

## 1. Distance Metrics

The most common distance metric is Euclidean distance:

$$d(p, q) = \\sqrt{\\sum_{i=1}^n (p_i - q_i)^2}$$

Alternative metrics include Manhattan Distance ($L_1$) and Minkowski Distance ($L_p$).

---

## 2. Choosing the Parameter $k$

- A small $k$ (e.g., $k=1$) leads to low bias but high variance (overfitting to noise).
- A large $k$ smooths boundaries, leading to low variance but higher bias (underfitting).
- Best practice: Always use an odd number for binary classification to avoid tie votes.
"""
            },
            {
                'title': 'K-Means Clustering',
                'algorithm_slug': 'k-means',
                'category': 'Clustering',
                'difficulty': 'Beginner',
                'reading_time_min': 8,
                'status': 'published',
                'summary': 'Unsupervised algorithm that partitions observations into k distinct clusters.',
                'intuition': 'Place $k$ flags randomly in a crowd. Everyone walks to their closest flag. Flags then move to the center of their crowd. Repeat until flags stop moving.',
                'content': """# K-Means Clustering

K-Means is an unsupervised partition clustering algorithm designed to group unlabeled data into $k$ distinct, non-overlapping subsets.

---

## 1. Objective Function: Inertia (WCSS)

K-Means seeks to minimize Within-Cluster Sum of Squares (Inertia):

$$J = \\sum_{j=1}^k \\sum_{x_i \\in C_j} \\| x_i - \\mu_j \\|^2$$

Where $\\mu_j$ is the centroid of cluster $C_j$.

---

## 2. Algorithm Steps (Lloyd's Algorithm)

1. **Initialization**: Select $k$ initial centroids (randomly or via K-Means++).
2. **Assignment Step**: Assign each observation $x_i$ to its closest centroid.
3. **Update Step**: Recompute each centroid $\\mu_j$ as the mean of points assigned to cluster $j$.
4. **Convergence Check**: Repeat steps 2 and 3 until centroids cease to change.
"""
            }
        ]

        # Add docs for remaining algorithms so all have rich descriptions
        extra_slugs = [
            ('Polynomial Regression', 'polynomial-regression', 'Regression', 'Intermediate'),
            ('Decision Tree', 'decision-tree', 'Classification', 'Intermediate'),
            ('Random Forest', 'random-forest', 'Classification', 'Advanced'),
            ('Support Vector Machine (SVM)', 'svm', 'Classification', 'Intermediate'),
            ('Naive Bayes', 'naive-bayes', 'Classification', 'Beginner')
        ]
        for name, slug, cat, diff in extra_slugs:
            docs.append({
                'title': name,
                'algorithm_slug': slug,
                'category': cat,
                'difficulty': diff,
                'reading_time_min': 9,
                'status': 'published',
                'summary': f'Comprehensive guide to {name}, including mathematical derivations, implementation tips, and interview insights.',
                'intuition': f'Understand how {name} models patterns and how to implement it using clean Python and NumPy.',
                'content': f"""# {name}

{name} is an important machine learning model in the {cat} domain.

## Overview
Learn how to build this algorithm from first principles and test its behavior against standard libraries like Scikit-learn.

### Step-by-Step Implementation
1. Prepare and inspect the input training data $(X, y)$.
2. Implement model initialization parameters.
3. Formulate the loss function or splitting criterion.
4. Execute training via `fit(X, y)`.
5. Predict class labels or continuous outcomes via `predict(X)`.

### When to Use
- When {cat.lower()} benchmarks are needed.
- When explainability and predictable behavior are required.
"""
            })

        for d in docs:
            d['created_at'] = now
            d['updated_at'] = now

        db.documentation.insert_many(docs)
        logger.info(f"Seeded {len(docs)} documentation articles.")

    logger.info("Database seeding completed successfully.")
