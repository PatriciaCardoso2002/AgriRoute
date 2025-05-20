import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para os ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RouteMap = ({ origem, destino }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLineRef = useRef(null);

  useEffect(() => {
    // Inicializa o mapa apenas uma vez
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([41.1579, -8.6291], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
    }

    const fetchRoute = async () => {
      if (!origem || !destino || !mapInstanceRef.current) return;

      try {
        // Limpa marcadores e rotas anteriores
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        if (routeLineRef.current) {
          routeLineRef.current.remove();
          routeLineRef.current = null;
        }

        const response = await fetch('http://localhost:8002/v1/routing/get_route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origem, destino })
        });

        if (!response.ok) throw new Error('Erro ao buscar rota');

        const data = await response.json();
        const coords = data.rota.features[0].geometry.coordinates;
        const latlngs = coords.map(([lng, lat]) => [lat, lng]);

        // Desenha a nova rota
        routeLineRef.current = L.polyline(latlngs, { color: 'blue' }).addTo(mapInstanceRef.current);

        // Adiciona novos marcadores
        const startMarker = L.marker(latlngs[0]).addTo(mapInstanceRef.current)
          .bindPopup('Origem: ' + origem);
        
        const endMarker = L.marker(latlngs[latlngs.length - 1]).addTo(mapInstanceRef.current)
          .bindPopup('Destino: ' + destino);

        markersRef.current = [startMarker, endMarker];
        mapInstanceRef.current.fitBounds(routeLineRef.current.getBounds());

      } catch (err) {
        console.error('Erro ao carregar rota:', err);
        // Mostra mensagem de erro no mapa
        if (mapInstanceRef.current) {
          L.popup()
            .setLatLng([41.1579, -8.6291])
            .setContent('Erro ao carregar rota: ' + err.message)
            .openOn(mapInstanceRef.current);
        }
      }
    };

    fetchRoute();

    // Cleanup - remove apenas os elementos, não o mapa
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
    };
  }, [origem, destino]);

  return (
    <div
      ref={mapRef}
      style={{ height: '400px', width: '100%' }}
    />
  );
};

export default RouteMap;