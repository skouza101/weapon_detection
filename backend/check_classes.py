from ultralytics import YOLO
m = YOLO("/app/model/best.pt")
print(m.names)
