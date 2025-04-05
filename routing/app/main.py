from fastapi import FastAPI
from routes import routes
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Routing API (using Heigit)",
    description="Service for routing paths and get km and minutes taken, as well as letting kniow when finishing point is near.",
    version="1.0.0",
    docs_url="/api/docs",
)

origins = [
    "http://localhost:3000",  # React em dev
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # ou ["*"] para tudo (em dev)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(routes);