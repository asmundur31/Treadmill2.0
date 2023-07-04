import sys
from trackmaster import Treadmill

function_name = sys.argv[1]
port = sys.argv[2]
t = Treadmill(port)

def checkConnection():
  

def setSpeed(speed):
  Treadmill(port).speed = speed

def setIncline(incline):
  t.incline = incline

def getSpeed():
  print(t.get_actual_speed())

def getIncline():
  print(t.get_actual_elevation())

def start():
  t.start_belt()
  t.speed = 3

def stop():
  t.stop_belt()
