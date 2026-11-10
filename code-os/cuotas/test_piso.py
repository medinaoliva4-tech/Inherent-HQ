import unittest, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from cuotas_callback import piso_max_tokens

class T(unittest.TestCase):
    def test_sube(self): self.assertEqual(piso_max_tokens("nivel-medio", 50), 1000)
    def test_alto(self): self.assertEqual(piso_max_tokens("nivel-alto", 1500), 2000)
    def test_no_baja(self): self.assertEqual(piso_max_tokens("cp-glm-5.3", 4000), 4000)
    def test_sin_valor(self): self.assertIsNone(piso_max_tokens("nivel-bajo", None))
    def test_otros_modelos(self): self.assertEqual(piso_max_tokens("kimi-k3", 50), 50)
unittest.main()
