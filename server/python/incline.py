import sys
from trackmaster import Treadmill

t = Treadmill('/dev/tty.usbserial-D30B78YP')

incline = sys.argv[1]
t.incline = float(incline)
