import unittest
import json
import sys
import io

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from app import create_app
from app.config import Config

class TestMLLaboratoryBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_01_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        print("✓ Health check passed.")

    def test_02_demo_login_and_auth(self):
        # Student Demo Login
        res = self.client.post('/api/auth/demo-login', json={'role': 'user'})
        self.assertEqual(res.status_code, 202)
        data = res.get_json()
        self.assertTrue(data['requires_otp'])
        self.assertEqual(data['user']['role'], 'user')
        student_token = self._verify_otp(data)

        # Access /api/auth/me
        res_me = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {student_token}'})
        self.assertEqual(res_me.status_code, 200)

        # Admin Login with credentials
        res_admin = self.client.post('/api/auth/login', json={
            'email': Config.ADMIN_EMAIL,
            'password': Config.ADMIN_PASSWORD
        })
        self.assertEqual(res_admin.status_code, 202)
        admin_data = res_admin.get_json()
        self.assertEqual(admin_data['user']['role'], 'admin')
        admin_token = self._verify_otp(admin_data)

        # Verify regular student is blocked from admin routes
        res_forbidden = self.client.get('/api/admin/stats', headers={'Authorization': f'Bearer {student_token}'})
        self.assertEqual(res_forbidden.status_code, 403)

        # Verify admin can access admin routes
        res_allowed = self.client.get('/api/admin/stats', headers={'Authorization': f'Bearer {admin_token}'})
        self.assertEqual(res_allowed.status_code, 200)
        print("✓ Authentication, tokens, and role-based access control passed.")

    def _verify_otp(self, challenge):
        self.assertIn('dev_otp', challenge)
        response = self.client.post('/api/auth/verify-otp', json={
            'email': challenge['email'],
            'temp_token': challenge['temp_token'],
            'purpose': challenge['purpose'],
            'otp': challenge['dev_otp']
        })
        self.assertEqual(response.status_code, 200)
        return response.get_json()['token']

    def test_03_algorithms_and_docs(self):
        res = self.client.get('/api/algorithms')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(len(data['algorithms']), 8)

        # Check Linear Regression
        res_lr = self.client.get('/api/algorithms/linear-regression')
        self.assertEqual(res_lr.status_code, 200)
        lr_data = res_lr.get_json()['algorithm']
        self.assertEqual(lr_data['category'], 'Regression')
        self.assertIn('starter_code', lr_data)

        # Check Documentation
        res_doc = self.client.get('/api/documentation/linear-regression')
        self.assertEqual(res_doc.status_code, 200)
        doc_data = res_doc.get_json()['documentation']
        self.assertIn('content', doc_data)
        print(f"✓ Algorithm catalog and documentation verified ({len(data['algorithms'])} algorithms).")

    def test_04_execution_sandbox_security_and_timeout(self):
        # 1. Normal execution
        code_normal = "print('Hello ML Lab!')\nx = 10 * 5\nprint(f'Result: {x}')"
        res = self.client.post('/api/code/execute', json={'code': code_normal})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('Result: 50', data['stdout'])

        # 2. Prohibited import blocked by AST
        code_malicious = "import os\nos.system('echo hacked')"
        res_bad = self.client.post('/api/code/execute', json={'code': code_malicious})
        self.assertEqual(res_bad.status_code, 200)
        data_bad = res_bad.get_json()
        self.assertFalse(data_bad['success'])
        self.assertIn('Security Policy Violation', data_bad['error'])

        # 3. Timeout enforcement
        code_infinite = "while True:\n    pass"
        res_timeout = self.client.post('/api/code/execute', json={'code': code_infinite})
        self.assertEqual(res_timeout.status_code, 200)
        data_timeout = res_timeout.get_json()
        self.assertFalse(data_timeout['success'])
        self.assertIn('Timed Out', data_timeout['stderr'])
        print("✓ Sandboxed code execution: Safe execution, AST Security Filter, and Timeout enforcement verified.")

    def test_05_comparison_engine(self):
        # Fetch Linear Regression scratch starter code and run test
        res_lr = self.client.get('/api/algorithms/linear-regression')
        scratch_code = res_lr.get_json()['algorithm']['starter_code']['scratch']

        res_test = self.client.post('/api/tests/run', json={
            'algorithm_slug': 'linear-regression',
            'scratch_code': scratch_code
        })
        self.assertEqual(res_test.status_code, 200)
        test_res = res_test.get_json()
        self.assertTrue(test_res['success'])
        
        # Verify Scratch and Built-in sections exist
        self.assertIn('scratch_result', test_res)
        self.assertIn('builtin_result', test_res)
        self.assertIn('verdict', test_res)
        
        scratch = test_res['scratch_result']
        builtin = test_res['builtin_result']
        verdict = test_res['verdict']

        self.assertTrue(scratch['success'])
        self.assertTrue(builtin['success'])
        self.assertIn('r2_score', scratch['metrics'])
        self.assertIn('r2_score', builtin['metrics'])
        self.assertTrue(verdict['passed'])
        print(f"✓ Scratch vs. Built-in Comparison passed: R² Scratch={scratch['metrics']['r2_score']}, Built-in={builtin['metrics']['r2_score']} (Verdict: {verdict['message']})")

    def test_06_datasets_and_preview(self):
        res = self.client.get('/api/datasets')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(len(data['datasets']), 4)

        # Preview dataset
        res_prev = self.client.get('/api/datasets/house_prices/preview')
        self.assertEqual(res_prev.status_code, 200)
        prev_data = res_prev.get_json()
        self.assertGreater(prev_data['total_rows'], 0)
        self.assertGreater(len(prev_data['columns']), 0)
        print("✓ Dataset playground and statistical analysis verified.")

if __name__ == '__main__':
    unittest.main()
