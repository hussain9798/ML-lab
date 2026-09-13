import io
import pandas as pd
from flask import Blueprint, request, jsonify
from app.services.dataset_service import init_sample_datasets, get_dataset_by_id, analyze_dataframe

datasets_bp = Blueprint('datasets', __name__)

@datasets_bp.route('', methods=['GET'])
def list_datasets():
    datasets = init_sample_datasets()
    summaries = []
    for d_id, d in datasets.items():
        summaries.append({
            'id': d['id'],
            'name': d['name'],
            'description': d['description'],
            'category': d['category'],
            'features': d['features'],
            'target': d['target'],
            'row_count': len(d['df']),
            'col_count': len(d['df'].columns)
        })
    return jsonify({'datasets': summaries}), 200


@datasets_bp.route('/<dataset_id>/preview', methods=['GET'])
def preview_dataset(dataset_id: str):
    d = get_dataset_by_id(dataset_id)
    if not d:
        return jsonify({'error': f'Dataset "{dataset_id}" not found.'}), 404

    analysis = analyze_dataframe(d['df'])
    analysis.update({
        'id': d['id'],
        'name': d['name'],
        'description': d['description'],
        'category': d['category'],
        'features': d['features'],
        'target': d['target']
    })
    return jsonify(analysis), 200


@datasets_bp.route('/upload', methods=['POST'])
def upload_dataset():
    """Parses user uploaded CSV file or text and returns instantaneous statistical analysis."""
    df = None
    if 'file' in request.files:
        file = request.files['file']
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Only CSV files are supported.'}), 400
        try:
            df = pd.read_csv(file)
        except Exception as e:
            return jsonify({'error': f'Error parsing CSV: {str(e)}'}), 400
    else:
        csv_text = request.get_json(silent=True) or {}
        raw_content = csv_text.get('csv_content')
        if not raw_content:
            return jsonify({'error': 'No CSV file or csv_content string provided.'}), 400
        try:
            df = pd.read_csv(io.StringIO(raw_content))
        except Exception as e:
            return jsonify({'error': f'Error parsing CSV data: {str(e)}'}), 400

    if df is None or df.empty:
        return jsonify({'error': 'The uploaded dataset is empty.'}), 400

    if len(df) > 5000:
        df = df.iloc[:5000]

    analysis = analyze_dataframe(df)
    return jsonify({
        'message': 'Dataset analyzed successfully.',
        'analysis': analysis
    }), 200
