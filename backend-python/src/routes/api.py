from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from datetime import datetime
import sqlite3
import re
from typing import Union
from ..database.init import get_sql_db

api_router = APIRouter()

class VampireProfileUpdate(BaseModel):
    name: str
    email: str
    age: Union[str, int]
    clan: str
    preferred_blood_type: str
    hunting_territory: str
    
    @validator('age')
    def validate_age(cls, v):
        if isinstance(v, str):
            try:
                age_int = int(v)
            except ValueError:
                raise ValueError('Age must be a valid number')
        else:
            age_int = v
            
        if not isinstance(age_int, int):
            raise ValueError('Age must be a valid number')
            
        if age_int < 18:
            raise ValueError('🧛‍♂️ We apologize, but we cannot welcome underage vampires to our ancient coven. Please come back when you\'ve reached the age of immortality (18)!')
        return age_int
    
    @validator('email')
    def validate_email(cls, v):
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, v):
            raise ValueError('Please enter a valid email address')
        return v

def dict_factory(cursor, row):
    """Convert sqlite3.Row to dict"""
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

# Vampire Profile endpoints (REST + SQL)
@api_router.get('/vampire/profile')
async def get_vampire_profile():
    sql_db = get_sql_db()
    sql_db.row_factory = dict_factory
    cursor = sql_db.cursor()
    
    try:
        cursor.execute('SELECT * FROM vampire_profiles LIMIT 1')
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail='Vampire profile not found')
        
        return row
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put('/vampire/profile')
async def update_vampire_profile(profile_data: VampireProfileUpdate):
    sql_db = get_sql_db()
    cursor = sql_db.cursor()
    
    # Validate required fields
    if not profile_data.name or not profile_data.email or not profile_data.age or not profile_data.clan or not profile_data.preferred_blood_type or not profile_data.hunting_territory:
        raise HTTPException(status_code=400, detail='All profile fields are required')
    
    try:
        cursor.execute('''
            UPDATE vampire_profiles 
            SET name = ?, email = ?, age = ?, clan = ?, preferred_blood_type = ?, hunting_territory = ?
            WHERE id = 1
        ''', [
            profile_data.name,
            profile_data.email,
            profile_data.age,
            profile_data.clan,
            profile_data.preferred_blood_type,
            profile_data.hunting_territory
        ])
        
        sql_db.commit()
        
        # B-2
        # Hmm, doesn't frontend expect to receive the updated profile here instead?
        return {'success': True, 'message': 'Profile updated successfully'}
        
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post('/vampire/feed')
async def vampire_feed():
    sql_db = get_sql_db()
    cursor = sql_db.cursor()
    now = datetime.now().isoformat()
    
    try:
        cursor.execute('''
            UPDATE vampire_profiles 
            SET last_fed = ?, power_level = CASE 
                WHEN power_level < 90 THEN power_level + 10 
                ELSE 100 
            END
            WHERE id = 1
            RETURNING *
        ''', [now])
        
        sql_db.row_factory = dict_factory
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=500, detail='Failed to retrieve updated profile')
        
        sql_db.commit()
        return row
        
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
