# ML Laboratory — Interactive Full-Stack Machine Learning Platform

**ML Laboratory** is a production-quality educational web application designed to teach machine learning from first principles. Students learn the mathematics and intuition behind algorithms, implement them from scratch using pure Python and NumPy, test their implementations in an isolated execution sandbox, and compare their results side-by-side against standard industry benchmarks such as **Scikit-learn** with automated validation verdicts and interactive visualizations.

---

## 🚀 The Core Learning Workflow

$$\text{Learn} \longrightarrow \text{Understand} \longrightarrow \text{Implement} \longrightarrow \text{Test} \longrightarrow \text{Compare} \longrightarrow \text{Validate} \longrightarrow \text{Save} \longrightarrow \text{Track Progress}$$

The platform is NOT just an ML model-training UI. Its core purpose is to force users to understand how ML algorithms work internally, verify their own implementations against trusted libraries, and earn verified milestone badges.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Monaco Code Editor (`@monaco-editor/react`), Recharts, Lucide Icons, Axios.
- **Backend**: Python 3.12, Flask, REST API, JWT Authentication (`pyjwt`), Password Hashing (`bcrypt`), `pymongo`.
- **Database**: MongoDB (MongoDB Atlas compatible via `.env` connection string, local MongoDB, with an automatic resilient in-memory fallback for instant setup).
- **Machine Learning**: NumPy, Pandas, Scikit-learn, SciPy.
- **Code Execution Sandbox**: AST static safety filter, subprocess isolation with ephemeral temp workspaces, execution timeout (6s limit), memory and output truncation safeguards.
- **Deployment**: Docker, Docker Compose, Nginx.

---

## 🌟 Key Features

### 1. Unified ML Laboratory & Monaco IDE
- Single-page IDE header with dynamic algorithm selector and **[ From Scratch ▼ ]** vs **[ Built-in Library ]** mode switch.
- Full Monaco code editor with syntax highlighting, line numbers, and status bar.
- Action buttons: **Run Code** (sandbox execution), **Test & Compare** (benchmark against Sklearn), **Reset Code**, **Save Implementation**.

### 2. Side-by-Side Scratch vs. Built-in Comparison Card
- 2-column comparative display:
  - **FROM SCRATCH**: Predictions, R² / Accuracy / Inertia, Error, Execution Time, Status tag.
  - **BUILT-IN (Scikit-learn)**: Predictions, R² / Accuracy / Inertia, Error, Execution Time, Status tag.
- **Automated Validation Verdict**:
  - `✅ Your implementation is correct. Scratch output is within the accepted difference (Δ <= tolerance) from the built-in implementation.`
  - `❌ Implementation needs improvement.` with exact numerical delta diagnostics.

### 3. Interactive Visualizations (Recharts)
- **Regression**: Scatter plot of actual test points with Scratch regression line overlaid on the Built-in Scikit-learn line.
- **Classification**: Interactive Confusion Matrix grid and side-by-side performance bar charts (Accuracy, Precision, Recall, F1).
- **Clustering**: 2D scatter of cluster assignments and centroid markers.

### 4. Curriculum Documentation
- Mathematical concepts and LaTeX formulas ($$...$$).
- Intuition and step-by-step algorithms.
- Advantages, disadvantages, and limitations.
- Top technical interview questions with model answers.
- Prominent **"Open in Laboratory →"** button.

### 5. Dataset Playground
- Pre-loaded sample datasets: House Prices (Regression), Iris Flower (Classification), Customer Churn (Classification), Customer Blobs (Clustering), Diabetes.
- Inspect row/column counts, missing values, data types, and descriptive statistics (mean, std, min, max, quartiles).
- Upload custom CSV files with instant analysis.

### 6. Admin Panel (Role-Based Security)
- Protected frontend routes (`/admin/*`) and backend middleware checking JWT + `role === 'admin'`.
- Dynamic Algorithm Manager: Add new algorithms, configure starter code for scratch & builtin, set tolerances, and assign datasets without touching frontend code!
- Documentation Editor with Markdown and formula support.
- User Management: View registered students, progress, and change roles.

---

## ⚡ Quickstart Guide

### 1. Seed Accounts (Pre-configured)
When the backend starts up, it automatically seeds the initial accounts:
- **Student Demo**: `student@mllab.com` / `Student123!`
- **Admin Demo**: `admin@mllab.com` / `Admin123!`
*(Quick one-click login buttons are also available on the Login page).*

### 2. Running Locally (Step-by-Step)

#### Backend Setup
```bash
cd backend
# Install dependencies
py -m pip install -r requirements.txt

# Run the Flask backend server (port 5000)
py run.py
```

#### Frontend Setup
```bash
cd frontend
# Install dependencies
npm install

# Start Vite dev server (port 5173)
npm run dev
```

Open your browser at `http://localhost:5173`.

---

### 3. Running with Docker Compose
To run MongoDB, the Flask backend, and the React frontend in containers:
```bash
docker compose up --build
```
Access the application at `http://localhost:5173`.

---

## 🧪 Automated Testing

To run the complete automated integration test suite:
```bash
cd backend
py test_suite.py
```

Tests verify:
1. Health check endpoint.
2. User registration, login, JWT issuance, and Admin RBAC.
3. Algorithm catalog and documentation retrieval.
4. Isolated code execution sandbox: normal execution, AST security block (`import os`), and timeout enforcement (`while True: pass`).
5. Scratch vs. Built-in comparison engine (Linear Regression execution, metrics calculation, and verdict generation).
6. Dataset playground and statistical analysis.

---

## 🔒 Security Architecture

Arbitrary Python user code execution is secured via multi-layered defenses:
1. **No direct `exec()`** in the primary Flask process.
2. **AST Static Pre-checker**: Rejects prohibited modules (`os`, `sys`, `subprocess`, `socket`, `ctypes`, `shutil`, `urllib`, `requests`) and dangerous built-ins (`eval`, `exec`, `__import__`, `open`).
3. **Isolated Ephemeral Subprocess**: Code runs in a temporary directory with output size truncation (50KB) and strict timeouts (6 seconds).
4. **JWT Authentication & Password Hashing**: Passwords are encrypted with salt using `bcrypt`.
