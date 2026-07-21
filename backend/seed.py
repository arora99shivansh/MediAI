import asyncio
import os
from datetime import datetime, UTC
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_doctors():
    # Connecting to MongoDB
    # Adjust URI based on env, but we'll try standard localhost for local development
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.mediai
    
    print("Clearing existing doctors to avoid duplicates...")
    await db.users.delete_many({"role": "doctor"})

    doctors = [
        {
            "full_name": "Dr. Sarah Smith",
            "email": "sarah.smith@mediai.com",
            "password_hash": pwd_context.hash("Password123!"),
            "role": "doctor",
            "is_verified": True,
            "created_at": datetime.now(UTC),
            "specialization": "Cardiologist",
            "experience_years": 15,
            "consultation_fee": 150.0,
            "hospital": "City Heart Center",
            "city": "New York",
            "about": "Expert in cardiovascular diseases with 15 years of clinical experience.",
            "availability": {
                "Monday": ["09:00 AM", "10:00 AM", "11:00 AM"],
                "Tuesday": ["02:00 PM", "03:00 PM", "04:00 PM"],
                "Wednesday": ["09:00 AM", "11:00 AM", "02:00 PM"],
                "Thursday": ["10:00 AM", "01:00 PM"],
                "Friday": ["09:00 AM", "10:00 AM", "11:00 AM"],
            }
        },
        {
            "full_name": "Dr. James Wilson",
            "email": "james.wilson@mediai.com",
            "password_hash": pwd_context.hash("Password123!"),
            "role": "doctor",
            "is_verified": True,
            "created_at": datetime.now(UTC),
            "specialization": "General Physician",
            "experience_years": 8,
            "consultation_fee": 75.0,
            "hospital": "Downtown Clinic",
            "city": "Los Angeles",
            "about": "Dedicated general physician focusing on preventive care and family medicine.",
            "availability": {
                "Monday": ["08:00 AM", "09:00 AM", "04:00 PM", "05:00 PM"],
                "Wednesday": ["08:00 AM", "09:00 AM", "04:00 PM", "05:00 PM"],
                "Friday": ["08:00 AM", "09:00 AM", "10:00 AM"],
            }
        },
        {
            "full_name": "Dr. Emily Chen",
            "email": "emily.chen@mediai.com",
            "password_hash": pwd_context.hash("Password123!"),
            "role": "doctor",
            "is_verified": True,
            "created_at": datetime.now(UTC),
            "specialization": "Dermatologist",
            "experience_years": 5,
            "consultation_fee": 120.0,
            "hospital": "Skin & Care Institute",
            "city": "Chicago",
            "about": "Specialist in medical and cosmetic dermatology.",
            "availability": {
                "Tuesday": ["10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM"],
                "Thursday": ["10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM"],
            }
        }
    ]

    print(f"Inserting {len(doctors)} doctors...")
    result = await db.users.insert_many(doctors)
    print(f"Successfully inserted {len(result.inserted_ids)} doctors.")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_doctors())
