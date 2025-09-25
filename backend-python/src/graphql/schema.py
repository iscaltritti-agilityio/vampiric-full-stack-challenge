import strawberry
from typing import List, Optional
from datetime import datetime
import time
from ..database.init import get_nosql_db
@strawberry.type
class BloodSack:
    id: strawberry.ID
    name: str
    bloodType: str
    age: int
    location: str
    isRecruited: bool
    recruitedDate: Optional[str] = None
    pricePerPint: float
    quality: str
    lastSeen: str
    notes: Optional[str] = None

@strawberry.input
class BloodSackFilter:
    bloodType: Optional[str] = None
    recruited: Optional[bool] = None
    quality: Optional[str] = None
    location: Optional[str] = None

@strawberry.input
class BloodSackInput:
    name: str
    bloodType: str
    age: int
    location: str
    quality: Optional[str] = None
    notes: Optional[str] = None

# Helper function to calculate blood price based on type and quality
def calculate_price(blood_type: str, quality: str) -> float:
    base_price_map = {
        'O-': 200,
        'AB-': 180,
        'A-': 150,
        'B-': 150,
        'O+': 120,
        'AB+': 100,
        'A+': 100,
        'B+': 80
    }
    base_price = base_price_map.get(blood_type, 100)
    
    quality_multiplier_map = {
        'Premium': 1.5,
        'Good': 1.2,
        'Average': 1.0,
        'Poor': 0.7
    }
    quality_multiplier = quality_multiplier_map.get(quality, 1.0)
    
    return round(base_price * quality_multiplier)

@strawberry.type
class Query:
    @strawberry.field
    def blood_sacks(self, filter: Optional[BloodSackFilter] = None) -> List[BloodSack]:
        nosql_db = get_nosql_db()
        blood_sacks = nosql_db.get('bloodSacks', []).copy()
        
        if filter:
            if filter.bloodType:
                blood_sacks = [sack for sack in blood_sacks if sack['bloodType'] == filter.bloodType]
            if filter.recruited is not None:
                blood_sacks = [sack for sack in blood_sacks if sack['isRecruited'] == filter.recruited]
            if filter.quality:
                blood_sacks = [sack for sack in blood_sacks if sack['quality'] == filter.quality]
            if filter.location:
                blood_sacks = [sack for sack in blood_sacks if sack['location'] == filter.location]
        
        # Convert dict to BloodSack objects
        return [BloodSack(**sack) for sack in blood_sacks]
    
    @strawberry.field
    def blood_sack(self, id: strawberry.ID) -> Optional[BloodSack]:
        nosql_db = get_nosql_db()
        blood_sacks = nosql_db.get('bloodSacks', [])
        
        for sack in blood_sacks:
            if sack['id'] == str(id):
                return BloodSack(**sack)
        
        return None

@strawberry.type
class Mutation:
    @strawberry.mutation
    def add_blood_sack(self, input: BloodSackInput) -> BloodSack:
        nosql_db = get_nosql_db()
        blood_sacks = nosql_db.get('bloodSacks', [])
        
        new_sack = {
            'id': str(int(time.time() * 1000)),  # Use timestamp like Node version
            'name': input.name,
            'bloodType': input.bloodType,
            'age': input.age,
            'location': input.location,
            'isRecruited': False,
            'pricePerPint': calculate_price(input.bloodType, input.quality or 'Average'),
            'quality': input.quality or 'Average',
            'lastSeen': datetime.now().isoformat(),
            'notes': input.notes or ''
        }
        
        blood_sacks.append(new_sack)
        nosql_db['bloodSacks'] = blood_sacks
        
        return BloodSack(**new_sack)
    
    @strawberry.mutation
    def recruit_blood_sack(self, id: strawberry.ID) -> BloodSack:
        nosql_db = get_nosql_db()
        blood_sacks = nosql_db.get('bloodSacks', [])
        
        sack_index = None
        for i, sack in enumerate(blood_sacks):
            if sack['id'] == str(id):
                sack_index = i
                break
        
        if sack_index is None:
            raise Exception('Blood sack not found')
        
        # BUG B-2: Not updating the recruited status properly
        # blood_sacks[sack_index]['isRecruited'] = True
        # blood_sacks[sack_index]['recruitedDate'] = datetime.now().isoformat()
        # blood_sacks[sack_index]['pricePerPint'] = 0
        
        nosql_db['bloodSacks'] = blood_sacks
        
        return BloodSack(**blood_sacks[sack_index])

# Create the schema
schema = strawberry.Schema(query=Query, mutation=Mutation)
