from pydantic import BaseModel

class RouteRequest(BaseModel):
    origem: str
    destino: str