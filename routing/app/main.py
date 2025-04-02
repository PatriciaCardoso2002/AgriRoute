from fastapi import FastAPI
from routes import routes


app = FastAPI(
    title="Routing API (using Heigit)",
    description="Service for routing paths and get km and minutes taken, as well as letting kniow when finishing point is near.",
    version="1.0.0",
    docs_url="/api/docs",
)

app.include_router(routes); 