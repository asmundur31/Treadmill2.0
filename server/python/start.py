import sys
from trackmaster import Treadmill

port = sys.argv[1]
t = Treadmill(port)

t.start_belt()
t.speed = 3
