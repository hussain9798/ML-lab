import io
import json
import logging
import numpy as np
import pandas as pd
from sklearn.datasets import load_iris, load_diabetes, make_classification, make_regression, make_blobs

logger = logging.getLogger(__name__)

SAMPLE_DATASETS = {}

def init_sample_datasets():
    """Prepares and caches sample datasets for testing and playground."""
    global SAMPLE_DATASETS
    if SAMPLE_DATASETS:
        return SAMPLE_DATASETS

    # 1. House Prices (Regression)
    np.random.seed(42)
    area = np.random.uniform(800, 3500, 100)
    bedrooms = np.random.randint(1, 6, 100)
    age = np.random.uniform(1, 30, 100)
    price = 50 + (area * 0.08) + (bedrooms * 15) - (age * 0.5) + np.random.normal(0, 10, 100)
    df_housing = pd.DataFrame({
        'area_sqft': np.round(area, 1),
        'bedrooms': bedrooms,
        'age_years': np.round(age, 1),
        'price_k': np.round(price, 2)
    })

    # 2. Iris Flower (Classification)
    iris = load_iris(as_frame=True)
    df_iris = iris.frame.copy()
    df_iris.columns = [c.replace(' (cm)', '').replace(' ', '_') for c in df_iris.columns]
    df_iris['species'] = iris.target

    # 3. Customer Segments Blobs (Clustering)
    X_blobs, _ = make_blobs(n_samples=120, centers=3, n_features=2, random_state=42, cluster_std=1.2)
    df_blobs = pd.DataFrame(np.round(X_blobs, 2), columns=['spending_score', 'annual_income_k'])

    # 4. Diabetes (Regression)
    diabetes = load_diabetes(as_frame=True)
    df_diabetes = diabetes.frame.iloc[:100].copy()

    # 5. Customer Churn Toy (Binary Classification)
    X_class, y_class = make_classification(n_samples=120, n_features=4, n_informative=3, n_redundant=0, random_state=42)
    df_churn = pd.DataFrame(np.round(X_class, 3), columns=['usage_frequency', 'support_calls', 'tenure_months', 'monthly_charges'])
    df_churn['churned'] = y_class

    SAMPLE_DATASETS = {
        'house_prices': {
            'id': 'house_prices',
            'name': 'House Prices Dataset',
            'description': 'Predict house prices based on square footage, bedrooms, and age.',
            'category': 'regression',
            'features': ['area_sqft', 'bedrooms', 'age_years'],
            'target': 'price_k',
            'df': df_housing
        },
        'iris': {
            'id': 'iris',
            'name': 'Iris Flower Dataset',
            'description': 'Classic multiclass classification of 3 iris species based on floral dimensions.',
            'category': 'classification',
            'features': ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
            'target': 'species',
            'df': df_iris
        },
        'customer_blobs': {
            'id': 'customer_blobs',
            'name': 'Customer Spending Segments',
            'description': '2D clustering dataset with 3 clear natural customer clusters.',
            'category': 'clustering',
            'features': ['spending_score', 'annual_income_k'],
            'target': None,
            'df': df_blobs
        },
        'diabetes': {
            'id': 'diabetes',
            'name': 'Diabetes Progression Dataset',
            'description': 'Regression dataset measuring disease progression one year after baseline.',
            'category': 'regression',
            'features': list(df_diabetes.columns[:-1]),
            'target': df_diabetes.columns[-1],
            'df': df_diabetes
        },
        'churn': {
            'id': 'churn',
            'name': 'Customer Churn Dataset',
            'description': 'Binary classification of whether a customer will churn or stay.',
            'category': 'classification',
            'features': ['usage_frequency', 'support_calls', 'tenure_months', 'monthly_charges'],
            'target': 'churned',
            'df': df_churn
        }
    }
    return SAMPLE_DATASETS


def get_dataset_by_id(dataset_id: str):
    datasets = init_sample_datasets()
    return datasets.get(dataset_id)


def analyze_dataframe(df: pd.DataFrame) -> dict:
    """Computes comprehensive statistics for dataset preview."""
    rows, cols = df.shape
    columns_info = []
    
    for col in df.columns:
        dtype = str(df[col].dtype)
        null_count = int(df[col].isnull().sum())
        col_meta = {
            'name': col,
            'type': dtype,
            'null_count': null_count,
            'null_pct': round(null_count / rows * 100, 1) if rows > 0 else 0
        }
        if pd.api.types.is_numeric_dtype(df[col]):
            col_meta.update({
                'mean': round(float(df[col].mean()), 3) if not np.isnan(df[col].mean()) else None,
                'std': round(float(df[col].std()), 3) if not np.isnan(df[col].std()) else None,
                'min': round(float(df[col].min()), 3) if not np.isnan(df[col].min()) else None,
                'max': round(float(df[col].max()), 3) if not np.isnan(df[col].max()) else None,
                'median': round(float(df[col].median()), 3) if not np.isnan(df[col].median()) else None,
            })
        else:
            col_meta.update({
                'unique_values': int(df[col].nunique()),
                'top_value': str(df[col].mode().iloc[0]) if not df[col].mode().empty else None
            })
        columns_info.append(col_meta)

    # Preview first 15 rows
    preview_records = df.head(15).replace({np.nan: None}).to_dict(orient='records')

    return {
        'total_rows': rows,
        'total_columns': cols,
        'columns': columns_info,
        'preview': preview_records
    }
