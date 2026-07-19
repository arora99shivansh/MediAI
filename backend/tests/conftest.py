import os
import sys
from pathlib import Path

os.environ.setdefault("SECRET_KEY", "test-secret-key-with-more-than-32-characters")
sys.path.append(str(Path(__file__).resolve().parents[1]))
