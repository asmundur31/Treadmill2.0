import sys
from trackmaster import Treadmill

t = Treadmill('/dev/tty.usbserial-D30B78YP')

speed = sys.argv[1]
t.speed = float(speed)
