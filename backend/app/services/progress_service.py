import datetime
from bson import ObjectId
from app.db import get_db

def get_user_progress(user_id: str):
    """
    Computes overall ML progress metrics for the user across all published algorithms.
    """
    db = get_db()
    
    # Fetch all published algorithms
    algorithms = list(db.algorithms.find({'status': 'published'}))
    total_algos = len(algorithms)
    if total_algos == 0:
        return {
            'overall_percentage': 0,
            'total_algorithms': 0,
            'completed_count': 0,
            'in_progress_count': 0,
            'not_started_count': 0,
            'tests_passed_count': 0,
            'total_experiments': 0,
            'algorithm_progress': []
        }

    # Fetch user's progress records
    progress_records = {
        p.get('algorithm_slug'): p for p in db.progress.find({'user_id': user_id})
    }

    # Fetch experiments count
    total_experiments = db.experiments.count_documents({'user_id': user_id})

    algo_statuses = []
    completed_count = 0
    in_progress_count = 0
    not_started_count = 0
    tests_passed_count = 0

    for algo in algorithms:
        slug = algo.get('slug')
        name = algo.get('name')
        category = algo.get('category')
        difficulty = algo.get('difficulty')

        rec = progress_records.get(slug, {})
        doc_read = rec.get('doc_read', False)
        scratch_done = rec.get('scratch_done', False)
        test_passed = rec.get('test_passed', False)
        compared = rec.get('compared', False)

        if test_passed:
            tests_passed_count += 1

        # Determine status
        if test_passed and compared:
            status = 'Completed'
            completed_count += 1
        elif doc_read or scratch_done or test_passed or compared:
            status = 'In Progress'
            in_progress_count += 1
        else:
            status = 'Not Started'
            not_started_count += 1

        # Calculate algorithm completion percentage
        milestones = [doc_read, scratch_done, test_passed, compared]
        pct = int(sum(milestones) / len(milestones) * 100)

        algo_statuses.append({
            'slug': slug,
            'name': name,
            'category': category,
            'difficulty': difficulty,
            'status': status,
            'percentage': pct,
            'milestones': {
                'doc_read': doc_read,
                'scratch_done': scratch_done,
                'test_passed': test_passed,
                'compared': compared
            },
            'last_updated': rec.get('updated_at')
        })

    overall_pct = int(completed_count / total_algos * 100) if total_algos > 0 else 0

    return {
        'overall_percentage': overall_pct,
        'total_algorithms': total_algos,
        'completed_count': completed_count,
        'in_progress_count': in_progress_count,
        'not_started_count': not_started_count,
        'tests_passed_count': tests_passed_count,
        'total_experiments': total_experiments,
        'algorithm_progress': algo_statuses
    }


def update_user_milestone(user_id: str, algo_slug: str, milestone: str, value: bool = True):
    """
    Updates milestone progress for a user and algorithm.
    Supported milestones: 'doc_read', 'scratch_done', 'test_passed', 'compared'.
    """
    valid_milestones = {'doc_read', 'scratch_done', 'test_passed', 'compared'}
    if milestone not in valid_milestones:
        raise ValueError(f"Invalid milestone: {milestone}")

    db = get_db()
    now = datetime.datetime.utcnow().isoformat()

    db.progress.update_one(
        {'user_id': user_id, 'algorithm_slug': algo_slug},
        {
            '$set': {
                milestone: value,
                'updated_at': now
            },
            '$setOnInsert': {
                'created_at': now
            }
        },
        upsert=True
    )
    return True
