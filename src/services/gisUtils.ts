import * as turf from '@turf/turf';
import { SpatialFeature, SpatialGeometryType } from '../types';

/**
 * Bounds of Banten / Lebak and vicinity for validation:
 * Longitude: 105.5 to 106.8
 * Latitude: -7.2 to -5.8
 */
export const LEBAK_REGION_BOUNDS = {
  minLng: 105.5,
  maxLng: 106.8,
  minLat: -7.2,
  maxLat: -5.8
};

/**
 * Convert Decimal Degrees to UTM Zone 48S coordinates
 * Kabupaten Lebak is situated in UTM Zone 48 South
 */
export function latLngToUTM48S(lat: number, lng: number): { easting: number; northing: number; zone: string } {
  const a = 6378137; // WGS84 major axis
  const f = 1 / 298.257223563; // flattening
  const b = a * (1 - f);
  const e2 = (a * a - b * b) / (a * a);
  const e02 = (a * a - b * b) / (b * b);

  const zoneNumber = 48;
  const centralMeridian = (zoneNumber - 1) * 6 - 180 + 3; // 105 deg East
  const k0 = 0.9996;

  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lng * Math.PI) / 180;
  const centralLonRad = (centralMeridian * Math.PI) / 180;

  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = e02 * Math.cos(latRad) * Math.cos(latRad);
  const A = Math.cos(latRad) * (lonRad - centralLonRad);

  const M = a * (
    (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * latRad -
    (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * latRad) +
    (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * latRad) -
    (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * latRad)
  );

  const x = k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * e02) * Math.pow(A, 5) / 120) + 500000;
  let y = k0 * (M + N * Math.tan(latRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 + (61 - 58 * T + T * T + 600 * C - 330 * e02) * Math.pow(A, 6) / 720));
  
  // Southern Hemisphere false northing
  if (lat < 0) {
    y += 10000000;
  }

  return {
    easting: Math.round(x),
    northing: Math.round(y),
    zone: '48S'
  };
}

/**
 * Calculate accurate geodesic distance along a polyline coordinates array
 * Returns distance in meters and formatted string
 */
export function calculateGeodesicDistance(coordinates: [number, number][]): { meters: number; formatted: string } {
  if (coordinates.length < 2) return { meters: 0, formatted: '0 m' };

  try {
    const line = turf.lineString(coordinates.map(([lat, lng]) => [lng, lat]));
    const lengthKm = turf.length(line, { units: 'kilometers' });
    const meters = Math.round(lengthKm * 1000);

    if (meters < 1000) {
      return { meters, formatted: `${meters.toLocaleString('id-ID')} m` };
    }
    return { meters, formatted: `${(meters / 1000).toFixed(2).replace('.', ',')} km` };
  } catch {
    return { meters: 0, formatted: '0 m' };
  }
}

/**
 * Calculate accurate geodesic area for a polygon
 * Returns area in square meters and hectares
 */
export function calculateGeodesicArea(coordinates: [number, number][]): { sqMeters: number; hectares: number; formatted: string } {
  if (coordinates.length < 3) return { sqMeters: 0, hectares: 0, formatted: '0 m²' };

  try {
    // Ensure polygon is closed
    const coords = [...coordinates];
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords.push(first);
    }

    const polygon = turf.polygon([coords.map(([lat, lng]) => [lng, lat])]);
    const sqMeters = Math.round(turf.area(polygon));
    const hectares = Number((sqMeters / 10000).toFixed(2));

    if (sqMeters >= 10000) {
      return {
        sqMeters,
        hectares,
        formatted: `${hectares.toLocaleString('id-ID')} ha (${(sqMeters / 1000000).toFixed(3).replace('.', ',')} km²)`
      };
    }
    return {
      sqMeters,
      hectares,
      formatted: `${sqMeters.toLocaleString('id-ID')} m² (${hectares.toFixed(2).replace('.', ',')} ha)`
    };
  } catch {
    return { sqMeters: 0, hectares: 0, formatted: '0 m²' };
  }
}

/**
 * Check whether coordinates fall in the Banten/Lebak region
 */
export function isWithinLebakVicinity(lat: number, lng: number): boolean {
  return (
    lng >= LEBAK_REGION_BOUNDS.minLng &&
    lng <= LEBAK_REGION_BOUNDS.maxLng &&
    lat >= LEBAK_REGION_BOUNDS.minLat &&
    lat <= LEBAK_REGION_BOUNDS.maxLat
  );
}

/**
 * Convert spatial features to standard GeoJSON FeatureCollection
 */
export function featuresToGeoJSON(features: SpatialFeature[], datasetTitle?: string) {
  return {
    type: 'FeatureCollection',
    name: datasetTitle || 'GEORuhay_Export',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
    },
    features: features.map(f => ({
      type: 'Feature',
      id: f.id,
      geometry: f.geometry,
      properties: {
        ...f.properties,
        dataset_id: f.dataset_id
      }
    }))
  };
}

/**
 * Convert spatial features to KML string
 */
export function featuresToKML(features: SpatialFeature[], title: string = 'GEORuhay Export'): string {
  const placemarks = features.map(f => {
    const name = f.properties?.name || 'Objek Geospasial';
    const desc = Object.entries(f.properties || {})
      .filter(([k]) => k !== 'name')
      .map(([k, v]) => `<b>${k}:</b> ${v}`)
      .join('<br/>');

    let geomXml = '';
    if (f.geometry.type === 'Point') {
      const [lng, lat] = f.geometry.coordinates;
      geomXml = `<Point><coordinates>${lng},${lat},0</coordinates></Point>`;
    } else if (f.geometry.type === 'LineString') {
      const coords = f.geometry.coordinates.map((c: any) => `${c[0]},${c[1]},0`).join(' ');
      geomXml = `<LineString><coordinates>${coords}</coordinates></LineString>`;
    } else if (f.geometry.type === 'Polygon') {
      const rings = f.geometry.coordinates.map((ring: any) => 
        ring.map((c: any) => `${c[0]},${c[1]},0`).join(' ')
      );
      geomXml = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${rings[0]}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
    }

    return `
    <Placemark>
      <name>${escapeXml(name)}</name>
      <description><![CDATA[${desc}]]></description>
      ${geomXml}
    </Placemark>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(title)}</name>
    <description>Diekspor dari GEORuhay - Sistem Informasi Geospasial Kabupaten Lebak</description>
    ${placemarks}
  </Document>
</kml>`;
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Convert spatial point features to CSV format
 */
export function featuresToCSV(features: SpatialFeature[]): string {
  const pointFeatures = features.filter(f => f.geometry.type === 'Point');
  if (pointFeatures.length === 0) {
    // If lines/polygons, extract representative centroid coordinate
    return 'id,name,category,latitude,longitude,geometry_type,properties\n' +
      features.map(f => {
        let lat = 0, lng = 0;
        if (f.geometry.type === 'Point') {
          lng = f.geometry.coordinates[0];
          lat = f.geometry.coordinates[1];
        } else if (f.geometry.type === 'LineString') {
          lng = f.geometry.coordinates[0][0];
          lat = f.geometry.coordinates[0][1];
        } else if (f.geometry.type === 'Polygon') {
          lng = f.geometry.coordinates[0][0][0];
          lat = f.geometry.coordinates[0][0][1];
        }
        return `"${f.id}","${(f.properties?.name || '').replace(/"/g, '""')}","${f.properties?.category || ''}",${lat},${lng},"${f.geometry.type}","${JSON.stringify(f.properties).replace(/"/g, '""')}"`;
      }).join('\n');
  }

  const allKeys = Array.from(new Set(pointFeatures.flatMap(f => Object.keys(f.properties))));
  const headers = ['id', 'name', 'latitude', 'longitude', ...allKeys.filter(k => k !== 'name')];

  const rows = pointFeatures.map(f => {
    const [lng, lat] = f.geometry.coordinates;
    const values = headers.map(h => {
      if (h === 'id') return `"${f.id}"`;
      if (h === 'name') return `"${(f.properties.name || '').replace(/"/g, '""')}"`;
      if (h === 'latitude') return lat;
      if (h === 'longitude') return lng;
      const val = f.properties[h];
      return val !== undefined ? `"${String(val).replace(/"/g, '""')}"` : '""';
    });
    return values.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Parse CSV text into spatial Point features
 */
export function parseCSVToFeatures(csvText: string, datasetId: string = 'imported'): { features: SpatialFeature[]; errors: string[] } {
  const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  const errors: string[] = [];
  const features: SpatialFeature[] = [];

  if (lines.length < 2) {
    errors.push('File CSV kosong atau tidak memiliki baris data.');
    return { features, errors };
  }

  const header = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  
  // Find latitude and longitude column indices
  const latIndex = header.findIndex(h => ['lat', 'latitude', 'lintang', 'y', 'lat_dd'].includes(h));
  const lngIndex = header.findIndex(h => ['lng', 'lon', 'longitude', 'bujur', 'x', 'lon_dd'].includes(h));
  const nameIndex = header.findIndex(h => ['name', 'nama', 'nama_objek', 'label', 'titik'].includes(h));

  if (latIndex === -1 || lngIndex === -1) {
    errors.push(`Kolom koordinat tidak terdeteksi. Ditemukan kolom: ${header.join(', ')}. Harap sertakan kolom 'lat'/'latitude' dan 'lng'/'longitude'.`);
    return { features, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const lat = parseFloat(cols[latIndex]);
    const lng = parseFloat(cols[lngIndex]);

    if (isNaN(lat) || isNaN(lng)) {
      errors.push(`Baris ${i + 1}: Koordinat lat/lng tidak valid ('${cols[latIndex]}', '${cols[lngIndex]}')`);
      continue;
    }

    if (!isWithinLebakVicinity(lat, lng)) {
      errors.push(`Baris ${i + 1}: Koordinat [${lat}, ${lng}] berada di luar cakupan wajar wilayah Kabupaten Lebak & Banten.`);
    }

    const props: Record<string, any> = {};
    header.forEach((h, idx) => {
      props[h] = cols[idx] || '';
    });

    features.push({
      id: `imported-csv-${i}-${Date.now()}`,
      dataset_id: datasetId,
      type: 'Point',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        name: nameIndex !== -1 ? cols[nameIndex] : `Objek Spasial ${i}`,
        ...props,
        source: 'Impor CSV Geospasial',
        verified: false
      }
    });
  }

  return { features, errors };
}

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}

/**
 * Parse KML string into spatial features
 */
export function parseKMLToFeatures(kmlText: string, datasetId: string = 'imported'): { features: SpatialFeature[]; errors: string[] } {
  const features: SpatialFeature[] = [];
  const errors: string[] = [];

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
    const placemarks = xmlDoc.getElementsByTagName('Placemark');

    for (let i = 0; i < placemarks.length; i++) {
      const pm = placemarks[i];
      const name = pm.getElementsByTagName('name')[0]?.textContent || `Placemark ${i + 1}`;
      const desc = pm.getElementsByTagName('description')[0]?.textContent || '';

      const point = pm.getElementsByTagName('Point')[0];
      const line = pm.getElementsByTagName('LineString')[0];
      const polygon = pm.getElementsByTagName('Polygon')[0];

      if (point) {
        const coordsStr = point.getElementsByTagName('coordinates')[0]?.textContent?.trim() || '';
        const parts = coordsStr.split(',');
        if (parts.length >= 2) {
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            features.push({
              id: `imported-kml-${i}-${Date.now()}`,
              dataset_id: datasetId,
              type: 'Point',
              geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              properties: { name, description: desc, source: 'Impor KML' }
            });
          }
        }
      } else if (line) {
        const coordsStr = line.getElementsByTagName('coordinates')[0]?.textContent?.trim() || '';
        const rawCoords = coordsStr.split(/\s+/).filter(Boolean);
        const coordinates: [number, number][] = [];
        for (const rc of rawCoords) {
          const [lng, lat] = rc.split(',').map(Number);
          if (!isNaN(lng) && !isNaN(lat)) coordinates.push([lng, lat]);
        }
        if (coordinates.length >= 2) {
          features.push({
            id: `imported-kml-${i}-${Date.now()}`,
            dataset_id: datasetId,
            type: 'LineString',
            geometry: {
              type: 'LineString',
              coordinates
            },
            properties: { name, description: desc, source: 'Impor KML' }
          });
        }
      } else if (polygon) {
        const coordsStr = polygon.getElementsByTagName('coordinates')[0]?.textContent?.trim() || '';
        const rawCoords = coordsStr.split(/\s+/).filter(Boolean);
        const coordinates: [number, number][] = [];
        for (const rc of rawCoords) {
          const [lng, lat] = rc.split(',').map(Number);
          if (!isNaN(lng) && !isNaN(lat)) coordinates.push([lng, lat]);
        }
        if (coordinates.length >= 3) {
          features.push({
            id: `imported-kml-${i}-${Date.now()}`,
            dataset_id: datasetId,
            type: 'Polygon',
            geometry: {
              type: 'Polygon',
              coordinates: [coordinates]
            },
            properties: { name, description: desc, source: 'Impor KML' }
          });
        }
      }
    }
  } catch (err: any) {
    errors.push(`Gagal mem-parsing KML: ${err?.message || err}`);
  }

  return { features, errors };
}
