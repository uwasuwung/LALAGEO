import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  Search,
  Maximize2,
  Minimize2,
  Home,
  Ruler,
  Compass,
  MapPin,
  Eye,
  EyeOff,
  Sliders,
  Info,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { store } from '../../services/store';
import { Dataset, SpatialFeature, LayerSetting } from '../../types';
import {
  latLngToUTM48S,
  calculateGeodesicDistance,
  calculateGeodesicArea,
  featuresToGeoJSON,
  isWithinLebakVicinity
} from '../../services/gisUtils';

// Basemap options
const BASEMAP_TILES = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  },
  positron: {
    name: 'CartoDB Positron (Terang)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO, © OpenStreetMap contributors',
    maxZoom: 19
  },
  dark: {
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO, © OpenStreetMap contributors',
    maxZoom: 19
  },
  satellite: {
    name: 'Esri Citra Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri, Earthstar Geographics',
    maxZoom: 18
  },
  topo: {
    name: 'OpenTopoMap (Topografi)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: © OpenStreetMap, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
    maxZoom: 17
  }
};

interface InteractiveMapProps {
  initialDatasetId?: string | null;
  onClearInitialDataset?: () => void;
  onNavigateToCatalog?: () => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  initialDatasetId,
  onClearInitialDataset,
  onNavigateToCatalog
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const geojsonLayersRef = useRef<{ [datasetId: string]: L.GeoJSON }>({});
  const measureLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // States
  const [currentBasemap, setCurrentBasemap] = useState<keyof typeof BASEMAP_TILES>('positron');
  const [layers, setLayers] = useState<LayerSetting[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<SpatialFeature | null>(null);
  const [leftPanelTab, setLeftPanelTab] = useState<'layers' | 'legend' | 'measure' | 'filter'>('layers');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  
  // Coordinates display
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [utmCoords, setUtmCoords] = useState<{ easting: number; northing: number; zone: string } | null>(null);

  // Measurement State
  const [measureMode, setMeasureMode] = useState<'none' | 'distance' | 'area'>('none');
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [measureResult, setMeasureResult] = useState<string>('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load store state
  useEffect(() => {
    const updateFromStore = () => {
      setLayers(store.getLayers());
      setDatasets(store.getDatasets());
    };
    updateFromStore();
    return store.subscribe(updateFromStore);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Kabupaten Lebak: -6.55, 106.25
    const map = L.map(mapContainerRef.current, {
      center: [-6.55, 106.25],
      zoom: 10,
      zoomControl: false
    });

    // Zoom control in top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Scale bar in bottom right
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

    // Initial base tile layer
    const initialTile = L.tileLayer(BASEMAP_TILES[currentBasemap].url, {
      attribution: BASEMAP_TILES[currentBasemap].attribution,
      maxZoom: BASEMAP_TILES[currentBasemap].maxZoom
    }).addTo(map);
    baseTileLayerRef.current = initialTile;

    // Measurement layer group
    const measureGroup = L.layerGroup().addTo(map);
    measureLayerGroupRef.current = measureGroup;

    // Mouse move listener for live coordinates
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(5));
      const lng = Number(e.latlng.lng.toFixed(5));
      setCursorCoords({ lat, lng });
      setUtmCoords(latLngToUTM48S(lat, lng));
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Basemap change
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(baseTileLayerRef.current);
    const newTile = L.tileLayer(BASEMAP_TILES[currentBasemap].url, {
      attribution: BASEMAP_TILES[currentBasemap].attribution,
      maxZoom: BASEMAP_TILES[currentBasemap].maxZoom
    }).addTo(mapInstanceRef.current);
    baseTileLayerRef.current = newTile;
  }, [currentBasemap]);

  // Synchronize GeoJSON layers with store
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const allFeatures = store.getFeatures();

    layers.forEach(layerSetting => {
      const ds = datasets.find(d => d.id === layerSetting.dataset_id);
      const dsFeatures = allFeatures.filter(f => f.dataset_id === layerSetting.dataset_id);

      // If layer already exists, remove it first
      if (geojsonLayersRef.current[layerSetting.dataset_id]) {
        map.removeLayer(geojsonLayersRef.current[layerSetting.dataset_id]);
        delete geojsonLayersRef.current[layerSetting.dataset_id];
      }

      if (layerSetting.visible && dsFeatures.length > 0) {
        const geojson = L.geoJSON(
          {
            type: 'FeatureCollection',
            features: dsFeatures.map(f => ({
              type: 'Feature',
              id: f.id,
              geometry: f.geometry,
              properties: { ...f.properties, _dataset_id: f.dataset_id, _feature_id: f.id }
            }))
          } as any,
          {
            style: () => ({
              color: layerSetting.color,
              weight: layerSetting.weight,
              opacity: layerSetting.opacity,
              fillColor: layerSetting.fillColor || layerSetting.color,
              fillOpacity: layerSetting.opacity * 0.4
            }),
            pointToLayer: (_feature, latlng) => {
              // Custom styled SVG pin marker
              const markerHtml = `
                <div style="background-color: ${layerSetting.color}; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="2.5"/></svg>
                </div>
              `;
              const customIcon = L.divIcon({
                html: markerHtml,
                className: 'custom-gis-pin',
                iconSize: [26, 26],
                iconAnchor: [13, 26],
                popupAnchor: [0, -26]
              });
              return L.marker(latlng, { icon: customIcon });
            },
            onEachFeature: (feature, layer) => {
              layer.on('click', () => {
                const targetFeature = allFeatures.find(f => f.id === feature.properties._feature_id);
                if (targetFeature) {
                  setSelectedFeature(targetFeature);
                }
              });

              // Tooltip on hover
              layer.bindTooltip(
                `<div class="font-medium text-xs">${feature.properties.name || 'Objek Spasial'}</div>
                 <div class="text-[10px] text-slate-500">${ds?.source_name || ''}</div>`,
                { direction: 'top', sticky: true, opacity: 0.95 }
              );
            }
          }
        ).addTo(map);

        geojsonLayersRef.current[layerSetting.dataset_id] = geojson;
      }
    });
  }, [layers, datasets]);

  // Handle Initial Dataset focus if passed from catalog
  useEffect(() => {
    if (!initialDatasetId || !mapInstanceRef.current) return;

    const layer = geojsonLayersRef.current[initialDatasetId];
    if (layer) {
      try {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [initialDatasetId, layers]);

  // Handle Measurement Click on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClickForMeasure = (e: L.LeafletMouseEvent) => {
      if (measureMode === 'none') return;

      const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      const updatedPoints = [...measurePoints, newPoint];
      setMeasurePoints(updatedPoints);

      renderMeasurementGraphics(updatedPoints, measureMode);

      if (measureMode === 'distance') {
        const res = calculateGeodesicDistance(updatedPoints);
        setMeasureResult(res.formatted);
      } else if (measureMode === 'area') {
        const res = calculateGeodesicArea(updatedPoints);
        setMeasureResult(res.formatted);
      }
    };

    if (measureMode !== 'none') {
      map.on('click', handleMapClickForMeasure);
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
      clearMeasurementGraphics();
    }

    return () => {
      map.off('click', handleMapClickForMeasure);
    };
  }, [measureMode, measurePoints]);

  const renderMeasurementGraphics = (points: [number, number][], mode: 'distance' | 'area') => {
    const group = measureLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();

    // Draw vertex dots
    points.forEach((pt, idx) => {
      const circle = L.circleMarker(pt, {
        radius: 5,
        color: '#D97706',
        fillColor: '#F59E0B',
        fillOpacity: 1,
        weight: 2
      });
      circle.bindTooltip(`Titik ${idx + 1}`, { permanent: false });
      group.addLayer(circle);
    });

    if (points.length >= 2) {
      if (mode === 'distance') {
        const polyline = L.polyline(points, {
          color: '#D97706',
          weight: 3,
          dashArray: '6, 6'
        });
        group.addLayer(polyline);
      } else if (mode === 'area') {
        const polygon = L.polygon(points, {
          color: '#D97706',
          fillColor: '#FBBF24',
          fillOpacity: 0.35,
          weight: 2,
          dashArray: '4, 4'
        });
        group.addLayer(polygon);
      }
    }
  };

  const clearMeasurementGraphics = () => {
    if (measureLayerGroupRef.current) {
      measureLayerGroupRef.current.clearLayers();
    }
  };

  const resetMeasurement = () => {
    setMeasurePoints([]);
    setMeasureResult('');
    clearMeasurementGraphics();
  };

  // Search function (by location name, kecamatan, or direct Lat,Lng coordinates)
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const q = query.toLowerCase().trim();

    // 1. Check if user typed coordinates: e.g. "-6.357, 106.248"
    const coordMatch = q.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setSearchResults([
          {
            id: 'coord-jump',
            title: `Koordinat Geografis [${lat.toFixed(5)}, ${lng.toFixed(5)}]`,
            subtitle: isWithinLebakVicinity(lat, lng) ? 'Wilayah Kabupaten Lebak / Banten' : 'Di luar jangkauan umum Lebak',
            type: 'koordinat',
            coordinates: [lat, lng]
          }
        ]);
        setIsSearching(false);
        return;
      }
    }

    // 2. Search against 28 authentic kecamatans
    const matchedKecamatan = store.getAdministrativeRegions()
      .filter(k => k.name.toLowerCase().includes(q) || k.capital?.toLowerCase().includes(q))
      .map(k => ({
        id: k.id,
        title: `Kecamatan ${k.name}`,
        subtitle: `Ibu Kota: ${k.capital} · Zona: ${k.zone} · ${k.villages_count} Desa`,
        type: 'kecamatan',
        coordinates: k.centroid
      }));

    // 3. Search against spatial features
    const allFeatures = store.getFeatures();
    const matchedFeatures = allFeatures
      .filter(f => f.properties?.name?.toLowerCase().includes(q) || f.properties?.category?.toLowerCase().includes(q))
      .slice(0, 8)
      .map(f => {
        let coords: [number, number] = [-6.55, 106.25];
        if (f.geometry.type === 'Point') {
          coords = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
        } else if (f.geometry.type === 'LineString') {
          coords = [f.geometry.coordinates[0][1], f.geometry.coordinates[0][0]];
        } else if (f.geometry.type === 'Polygon') {
          coords = [f.geometry.coordinates[0][0][1], f.geometry.coordinates[0][0][0]];
        }

        return {
          id: f.id,
          title: f.properties.name,
          subtitle: `${f.properties.category || 'Objek'} · ${f.properties.source || ''}`,
          type: 'feature',
          feature: f,
          coordinates: coords
        };
      });

    setSearchResults([...matchedKecamatan, ...matchedFeatures]);
    setIsSearching(false);
  };

  const jumpToSearchResult = (result: any) => {
    if (!mapInstanceRef.current || !result.coordinates) return;

    mapInstanceRef.current.flyTo(result.coordinates, result.type === 'kecamatan' ? 12 : 15, {
      duration: 1.2
    });

    if (result.feature) {
      setSelectedFeature(result.feature);
    }

    setSearchResults([]);
    setSearchQuery('');
  };

  const handleZoomHome = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([-6.55, 106.25], 10, { duration: 1 });
  };

  const handleZoomToLayer = (datasetId: string) => {
    const layer = geojsonLayersRef.current[datasetId];
    if (layer && mapInstanceRef.current) {
      try {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      } catch (err) {
        console.error('Cannot fit bounds:', err);
      }
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-100 overflow-hidden flex">
      {/* Map canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Top Bar on Map: Search & Basemap Switcher */}
      <div className="absolute top-3 left-16 z-30 flex flex-wrap items-center gap-2 max-w-2xl">
        {/* Search Input Box */}
        <div className="relative w-72 sm:w-80 shadow-md rounded-lg">
          <div className="relative flex items-center bg-white rounded-lg border border-slate-200">
            <Search className="w-4 h-4 text-slate-400 ml-3" />
            <input
              type="text"
              placeholder="Cari lokasi, kecamatan, atau koordinat..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="mr-2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-lg shadow-xl border border-slate-200 max-h-72 overflow-y-auto z-50 py-1">
              {searchResults.map(res => (
                <button
                  key={res.id}
                  onClick={() => jumpToSearchResult(res)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors flex items-start gap-2 border-b border-slate-100 last:border-0"
                >
                  <MapPin className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{res.title}</p>
                    <p className="text-[11px] text-slate-500">{res.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Basemap Picker Dropdown */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-md px-2 py-1 flex items-center gap-1">
          <span className="text-[11px] font-medium text-slate-500 pl-1">Peta Dasar:</span>
          <select
            value={currentBasemap}
            onChange={e => setCurrentBasemap(e.target.value as any)}
            className="text-xs font-medium text-slate-700 bg-transparent border-0 focus:ring-0 py-1 pr-6 pl-1 cursor-pointer"
          >
            {Object.entries(BASEMAP_TILES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Floating Tool Controls Top-Right */}
      <div className="absolute top-3 right-14 z-30 flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-md">
        <button
          onClick={handleZoomHome}
          title="Kembali ke Batas Kabupaten Lebak"
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
        >
          <Home className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setIsLeftPanelOpen(true);
            setLeftPanelTab('measure');
            setMeasureMode(measureMode === 'distance' ? 'none' : 'distance');
          }}
          title="Ukur Jarak Geodesik"
          className={`p-1.5 rounded-md transition-colors ${
            measureMode === 'distance' ? 'bg-[#1B4332] text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Ruler className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setIsLeftPanelOpen(true);
            setLeftPanelTab('measure');
            setMeasureMode(measureMode === 'area' ? 'none' : 'area');
          }}
          title="Ukur Luas Poligon Geodesik"
          className={`p-1.5 rounded-md transition-colors ${
            measureMode === 'area' ? 'bg-[#1B4332] text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          title="Buka / Tutup Panel Layer"
          className={`p-1.5 rounded-md transition-colors ${
            isLeftPanelOpen ? 'bg-slate-200 text-slate-800' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Left Collapsible Panel: Layers / Legend / Measurement */}
      {isLeftPanelOpen && (
        <div className="absolute left-3 top-16 bottom-10 w-80 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 z-30 flex flex-col overflow-hidden">
          {/* Panel Header Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 px-2 pt-2 gap-1">
            <button
              onClick={() => setLeftPanelTab('layers')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
                leftPanelTab === 'layers'
                  ? 'bg-white text-[#1B4332] border-t-2 border-[#1B4332] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Layer ({layers.filter(l => l.visible).length})
            </button>
            <button
              onClick={() => setLeftPanelTab('legend')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
                leftPanelTab === 'legend'
                  ? 'bg-white text-[#1B4332] border-t-2 border-[#1B4332] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Legenda
            </button>
            <button
              onClick={() => setLeftPanelTab('measure')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
                leftPanelTab === 'measure'
                  ? 'bg-white text-[#1B4332] border-t-2 border-[#1B4332] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ukur
            </button>
          </div>

          {/* Tab 1: Layer Management */}
          {leftPanelTab === 'layers' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Daftar Layer Geospasial</span>
                <button
                  onClick={onNavigateToCatalog}
                  className="text-[#1B4332] font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Katalog</span>
                </button>
              </div>

              <div className="space-y-2">
                {layers.map(layer => {
                  const ds = datasets.find(d => d.id === layer.dataset_id);
                  return (
                    <div
                      key={layer.id}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <button
                            onClick={() => store.toggleLayerVisibility(layer.id)}
                            className="mt-0.5 text-slate-600 hover:text-slate-900"
                            title={layer.visible ? 'Sembunyikan layer' : 'Tampilkan layer'}
                          >
                            {layer.visible ? (
                              <Eye className="w-4 h-4 text-[#1B4332]" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <div>
                            <p className="text-xs font-medium text-slate-800 leading-tight">
                              {layer.title}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {ds?.source_name} {ds?.is_demo && <span className="text-amber-700 font-semibold">[DEMO]</span>}
                            </p>
                          </div>
                        </div>

                        {/* Color swatch & Zoom to layer */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className="w-3 h-3 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: layer.color }}
                          />
                          <button
                            onClick={() => handleZoomToLayer(layer.dataset_id)}
                            title="Fokus ke layer ini"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Opacity slider */}
                      {layer.visible && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-2">
                          <Sliders className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-500">Transparansi:</span>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={layer.opacity}
                            onChange={e => store.setLayerOpacity(layer.id, parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1B4332]"
                          />
                          <span className="text-[10px] font-mono text-slate-600 w-8 text-right">
                            {Math.round(layer.opacity * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Dynamic Legend */}
          {leftPanelTab === 'legend' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Simbologi Layer Aktif
              </p>

              <div className="space-y-3">
                {layers.filter(l => l.visible).map(layer => {
                  const ds = datasets.find(d => d.id === layer.dataset_id);
                  return (
                    <div key={layer.id} className="flex items-start gap-2.5 text-xs">
                      <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: layer.color }}>
                        <span className="w-2.5 h-2.5 rounded-full bg-white opacity-80" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 leading-tight">{layer.title}</p>
                        <p className="text-[10px] text-slate-500">{ds?.category} · {ds?.source_name}</p>
                      </div>
                    </div>
                  );
                })}

                {layers.filter(l => l.visible).length === 0 && (
                  <p className="text-xs text-slate-400 italic">Tidak ada layer yang sedang aktif.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Measurement Tool */}
          {leftPanelTab === 'measure' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-800">Alat Pengukuran Geodesik</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Perhitungan menggunakan proyeksi bumi bola Turf.js (memperhitungkan kelengkungan permukaan bumi, bukan derajat datar).
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setMeasureMode('distance');
                      resetMeasurement();
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                      measureMode === 'distance'
                        ? 'bg-[#1B4332] text-white border-[#1B4332]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Ukur Jarak</span>
                  </button>

                  <button
                    onClick={() => {
                      setMeasureMode('area');
                      resetMeasurement();
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                      measureMode === 'area'
                        ? 'bg-[#1B4332] text-white border-[#1B4332]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Ukur Luas</span>
                  </button>
                </div>
              </div>

              {measureMode !== 'none' && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-900">
                      {measureMode === 'distance' ? 'Mengukur Jarak Garis' : 'Mengukur Luas Wilayah'}
                    </span>
                    <button
                      onClick={resetMeasurement}
                      className="text-[11px] text-amber-700 hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-amber-800 leading-normal">
                    {measureMode === 'distance'
                      ? 'Klik pada peta untuk menambah titik lintasan pengukuran.'
                      : 'Klik minimal 3 titik pada peta untuk membentuk poligon batas.'}
                  </p>

                  <div className="pt-2 border-t border-amber-200">
                    <span className="text-[10px] text-amber-700 uppercase font-semibold">Hasil Perhitungan:</span>
                    <p className="text-base font-bold font-mono text-amber-950 mt-0.5 tabular-nums">
                      {measureResult || 'Belum ada titik'}
                    </p>
                    <p className="text-[10px] text-amber-700 mt-1">
                      Jumlah Titik: {measurePoints.length}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Right Collapsible Panel: Feature Inspector / Attribute Detail */}
      {selectedFeature && (
        <div className="absolute right-3 top-16 bottom-10 w-88 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 z-30 flex flex-col overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#1B4332]" />
              <span className="text-xs font-bold text-slate-800">Identifikasi Objek Spasial</span>
            </div>
            <button
              onClick={() => setSelectedFeature(null)}
              className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {selectedFeature.type} · ID: {selectedFeature.id}
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                {selectedFeature.properties.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kategori: {selectedFeature.properties.category || 'Umum'}
              </p>
            </div>

            {/* Verification & Source badge */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Sumber: {selectedFeature.properties.source || 'Database GEORuhay'}</span>
              </div>
              {selectedFeature.properties.status_verifikasi && (
                <p className="text-[11px] text-slate-500 pl-5">
                  Status: {selectedFeature.properties.status_verifikasi}
                </p>
              )}
            </div>

            {/* Attribute Table */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Tabel Atribut Detail</p>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left divide-y divide-slate-200">
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(selectedFeature.properties)
                      .filter(([key]) => !key.startsWith('_') && key !== 'name')
                      .map(([key, val]) => (
                        <tr key={key} className="hover:bg-slate-50/50">
                          <td className="px-3 py-1.5 font-medium text-slate-500 capitalize bg-slate-50/40 w-1/3">
                            {key.replace(/_/g, ' ')}
                          </td>
                          <td className="px-3 py-1.5 text-slate-800 break-words">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  const geojson = featuresToGeoJSON([selectedFeature], selectedFeature.properties.name);
                  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selectedFeature.properties.name.replace(/\s+/g, '_')}.geojson`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 py-2 px-3 text-xs font-medium text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh GeoJSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Coordinates Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-white/95 backdrop-blur-sm border-t border-slate-200 z-20 px-4 flex items-center justify-between text-[11px] text-slate-600 font-mono">
        <div className="flex items-center gap-4">
          <span>
            Lintang/Bujur:{' '}
            <strong className="text-slate-800 tabular-nums">
              {cursorCoords ? `${cursorCoords.lat}°, ${cursorCoords.lng}°` : '-6.55000°, 106.25000°'}
            </strong>
          </span>
          {utmCoords && (
            <span className="hidden sm:inline">
              UTM {utmCoords.zone}:{' '}
              <strong className="text-slate-800 tabular-nums">
                X: {utmCoords.easting.toLocaleString('id-ID')} m, Y: {utmCoords.northing.toLocaleString('id-ID')} m
              </strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-slate-500">
            Sistem Geodesik: WGS 84 (EPSG:4326) / UTM 48S
          </span>
          <span className="text-[#1B4332] font-semibold">Kabupaten Lebak, Banten</span>
        </div>
      </div>
    </div>
  );
};
