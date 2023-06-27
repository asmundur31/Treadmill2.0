import sys
from trackmaster import Treadmill

port = sys.argv[1]
t = Treadmill(port)

print(t.get_actual_speed())
