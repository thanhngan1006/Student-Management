from fastapi import FastAPI
from pymongo import MongoClient
# from server.services.ScheduleService.schedule import generate_schedule_multi_class
# from schedule import generate_schedule_multi_class
from schedule import generate_schedule
from datetime import datetime

app = FastAPI()
client = MongoClient("mongodb://localhost:27017")
db = client["school"]

@app.post("/generate-schedules")
def generate():
    subjects = list(db["subjects"].find())
    # schedules = generate_schedule_multi_class(subjects)
    schedules = generate_schedule(subjects)

    for class_id, schedule in schedules.items():
        db["timetables"].update_one(
            {"class_id": class_id, "semester_id": "2024-2025-hk1"},
            {
                "$set": {
                    "schedule": schedule,
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )
    return schedules
