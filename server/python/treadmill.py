from time import sleep
from trackmaster import Treadmill

t = Treadmill('/dev/tty.usbserial-D30B78YP')

t.speed = 6
sleep(60)
t.incline = 5
sleep(60)
t.incline = 10
sleep(60)
t.incline = 15
sleep(5 * 60)
t.auto_stop()