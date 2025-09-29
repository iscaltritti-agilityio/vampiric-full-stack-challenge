import os
import sys
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
import uvicorn

from .database.init import init_database
from .routes.api import api_router
from .graphql.schema import schema

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize databases
init_database()

# REST API routes
app.include_router(api_router, prefix="/api")

# GraphQL server
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

# Health check
@app.get("/health")
async def health_check():
    return {"status": "OK", "timestamp": datetime.now().isoformat()}

def main():
    port = int(os.getenv("PORT", 4000))
    
    print(f"Server running on http://localhost:{port}")
    print(f"GraphQL endpoint: http://localhost:{port}/graphql")
    
    try:
        uvicorn.run(
            "src.main:app",
            host="0.0.0.0",
            port=port,
            reload=True,
            log_level="info"
        )
    except Exception as error:
        print(f"Failed to start server: {error}")
        sys.exit(1)

if __name__ == "__main__":
    main()
