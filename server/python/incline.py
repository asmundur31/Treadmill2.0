import sys
from trackmaster import Treadmill

port = sys.argv[1]
t = Treadmill(port)

incline = sys.argv[2]
t.incline = float(incline)
