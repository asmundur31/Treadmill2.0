import sys
from trackmaster import Treadmill

port = sys.argv[1]
t = Treadmill(port)

speed = sys.argv[2]
t.speed = float(speed)
