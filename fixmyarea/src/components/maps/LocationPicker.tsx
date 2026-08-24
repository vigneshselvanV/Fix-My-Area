import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Navigation,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
  Building2,
  LocateFixed,
} from 'lucide-react';
import L from 'leaflet';

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  address?: string;
  onChange: (lat: number, lng: number, address?: string) => void;
}

const POPULAR_AREAS = [
  { name: 'Indiranagar, BLR', lat: 12.9784, lng: 77.6408, label: 'Indiranagar 100ft Rd, Bengaluru' },
  { name: 'Koramangala, BLR', lat: 12.9352, lng: 77.6245, label: 'Koramangala 4th Block, Bengaluru' },
  { name: 'MG Road, BLR', lat: 12.9756, lng: 77.6066, label: 'MG Road / Brigade Rd, Bengaluru' },
  { name: 'Whitefield, BLR', lat: 12.9698, lng: 77.7499, label: 'Whitefield Main Rd, Bengaluru' },
  { name: 'Jayanagar, BLR', lat: 12.9250, lng: 77.5938, label: 'Jayanagar 4th Block, Bengaluru' },
  { name: 'Bandra, Mumbai', lat: 19.0596, lng: 72.8295, label: 'Bandra West, Mumbai' },
  { name: 'Connaught Pl, Del', lat: 28.6315, lng: 77.2167, label: 'Connaught Place, New Delhi' },
];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  address = '',
  onChange,
}) => {
  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState<string | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [customAddress, setCustomAddress] = useState<string>(address || 'Locating area...');
  const [manualLat, setManualLat] = useState<string>(latitude ? latitude.toFixed(6) : '12.971600');
  const [manualLng, setManualLng] = useState<string>(longitude ? longitude.toFixed(6) : '77.594600');

  // Place Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchingPlace, setSearchingPlace] = useState<boolean>(false);
  const [geocodingAddress, setGeocodingAddress] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reverse Geocoding: Converts (Lat, Lng) -> Human-Readable Street Address & Ward
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    setGeocodingAddress(true);

    geocodeTimeoutRef.current = setTimeout(async () => {
      let resolvedAddress = '';

      // 1. Try BigDataCloud Reverse Geocoder
      try {
        const bResp = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        if (bResp.ok) {
          const bData = await bResp.json();
          const road = bData.localityInfo?.administrative?.[3]?.name || bData.localityInfo?.administrative?.[2]?.name || '';
          const locality = bData.locality || bData.city || bData.principalSubdivision || '';
          const state = bData.principalSubdivision || '';
          const country = bData.countryName || '';

          const parts = [road, locality, state, country].filter(Boolean);
          if (parts.length > 0) {
            resolvedAddress = Array.from(new Set(parts)).join(', ');
          }
        }
      } catch (e) {
        console.warn('Reverse geocode error, trying secondary...', e);
      }

      // 2. Try OpenStreetMap Nominatim fallback
      if (!resolvedAddress) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: { 'Accept-Language': 'en' },
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

          if (resp.ok) {
            const data = await resp.json();
            if (data && data.display_name) {
              const addrObj = data.address || {};
              const road = addrObj.road || addrObj.street || addrObj.pedestrian || addrObj.highway || '';
              const suburb = addrObj.suburb || addrObj.neighbourhood || addrObj.quarter || addrObj.residential || '';
              const city = addrObj.city || addrObj.town || addrObj.municipality || addrObj.county || '';

              const parts = [road, suburb, city].filter(Boolean);
              resolvedAddress = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(',');
            }
          }
        } catch (osmErr) {
          console.warn('OSM Nominatim reverse geocode error:', osmErr);
        }
      }

      const finalAddress = resolvedAddress || `Civic Incident Pin (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
      setCustomAddress(finalAddress);
      setGeocodingAddress(false);
      onChange(lat, lng, finalAddress);
      updateMarkerPopup(finalAddress);
    }, 250);
  }, [onChange]);

  const updateMarkerPopup = (label: string) => {
    if (markerRef.current) {
      markerRef.current
        .bindPopup(
          `<div style="font-family:sans-serif; font-size:12px; font-weight:700; color:#0f172a; padding:3px;">
            📍 ${label}
          </div>`
        )
        .openPopup();
    }
  };

  // Place Search (Forward Geocoding)
  const handleSearchPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchingPlace(true);
    setGpsError(null);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=1`,
        {
          headers: { 'Accept-Language': 'en' },
        }
      );

      if (resp.ok) {
        const results = await resp.json();
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);
          const formatted = results[0].display_name.split(',').slice(0, 3).join(',');

          setManualLat(lat.toFixed(6));
          setManualLng(lng.toFixed(6));
          setCustomAddress(formatted);
          onChange(lat, lng, formatted);

          if (leafletMapRef.current && markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
            leafletMapRef.current.setView([lat, lng], 16);
            updateMarkerPopup(formatted);
          }
          setGpsSuccess(`Found: ${formatted}`);
          setTimeout(() => setGpsSuccess(null), 3500);
        } else {
          setGpsError('No location matches found. Please try a street or landmark name.');
        }
      }
    } catch (err) {
      setGpsError('Place search error. You can tap directly on the map.');
    } finally {
      setSearchingPlace(false);
    }
  };

  // Initialize interactive Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = latitude || 12.9716;
    const initialLng = longitude || 77.5946;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      const customPin = L.divIcon({
        className: 'picker-pin',
        html: `
          <div style="
            background-color: #0D6E6E;
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(13, 110, 110, 0.45);
            border: 3px solid #ffffff;
            cursor: grab;
          ">
            <div style="width: 12px; height: 12px; background-color: #ffffff; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customPin,
      }).addTo(map);

      marker.bindPopup(
        `<div style="font-family:sans-serif; font-size:12px; font-weight:700; color:#0f172a; padding:3px;">
          📍 ${customAddress || 'Pinned Location'}
        </div>`
      );

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setManualLat(pos.lat.toFixed(6));
        setManualLng(pos.lng.toFixed(6));
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        setManualLat(e.latlng.lat.toFixed(6));
        setManualLng(e.latlng.lng.toFixed(6));
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      leafletMapRef.current = map;
      markerRef.current = marker;

      if (!address) {
        reverseGeocode(initialLat, initialLng);
      }
    }
  }, []);

  // Update Leaflet map when external latitude/longitude props change
  useEffect(() => {
    if (latitude && longitude && leafletMapRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - latitude) > 0.0001 || Math.abs(currentPos.lng - longitude) > 0.0001) {
        markerRef.current.setLatLng([latitude, longitude]);
        leafletMapRef.current.setView([latitude, longitude], 16);
      }
    }
  }, [latitude, longitude]);

  // Device Current Location Handler
  const handleGetDeviceLocation = () => {
    setLoadingGps(true);
    setGpsError(null);
    setGpsSuccess(null);
    setAccuracyMeters(null);

    if (!navigator.geolocation) {
      fallbackNetworkLocation('Geolocation not supported by browser. Located via network IP.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy || 10);
        setAccuracyMeters(acc);
        applyLocation(lat, lng, `Device GPS Locked (Accurate to ±${acc}m)`);
      },
      (err) => {
        navigator.geolocation.getCurrentPosition(
          (pos2) => {
            const lat = pos2.coords.latitude;
            const lng = pos2.coords.longitude;
            const acc = Math.round(pos2.coords.accuracy || 50);
            setAccuracyMeters(acc);
            applyLocation(lat, lng, `Device Location Found (±${acc}m accuracy)`);
          },
          (err2) => {
            fallbackNetworkLocation('Browser location permission restricted. Located via network.');
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
    );
  };

  const applyLocation = (lat: number, lng: number, successMsg: string) => {
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));
    setLoadingGps(false);
    setGpsSuccess(successMsg);

    if (leafletMapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      leafletMapRef.current.setView([lat, lng], 16);
    }

    reverseGeocode(lat, lng);
    setTimeout(() => setGpsSuccess(null), 4000);
  };

  const fallbackNetworkLocation = async (userNote?: string) => {
    try {
      const resp = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.latitude && data.longitude) {
          const areaLabel = `${data.locality || data.city || 'District'}, ${data.principalSubdivision || ''}`.replace(/^, /, '');
          setCustomAddress(areaLabel);
          applyLocation(data.latitude, data.longitude, userNote || `Located Area: ${areaLabel}`);
          return;
        }
      }
    } catch (e) {
      console.warn('Network location failed:', e);
    }

    setLoadingGps(false);
    setGpsError('Could not auto-detect location. Please click a quick area button below or tap the map.');
  };

  const handleSelectPresetArea = (area: (typeof POPULAR_AREAS)[0]) => {
    setManualLat(area.lat.toFixed(6));
    setManualLng(area.lng.toFixed(6));
    setCustomAddress(area.label);
    onChange(area.lat, area.lng, area.label);

    if (leafletMapRef.current && markerRef.current) {
      markerRef.current.setLatLng([area.lat, area.lng]);
      leafletMapRef.current.setView([area.lat, area.lng], 16);
      updateMarkerPopup(area.label);
    }
    setGpsSuccess(`Jumped to ${area.name}`);
    setTimeout(() => setGpsSuccess(null), 2500);
  };

  const handleManualCoordChange = () => {
    const parsedLat = parseFloat(manualLat);
    const parsedLng = parseFloat(manualLng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      if (leafletMapRef.current && markerRef.current) {
        markerRef.current.setLatLng([parsedLat, parsedLng]);
        leafletMapRef.current.setView([parsedLat, parsedLng], 16);
      }
      reverseGeocode(parsedLat, parsedLng);
    }
  };

  return (
    <div className="space-y-3 font-sans w-full">
      
      {/* Top Search & Current Device GPS Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <form onSubmit={handleSearchPlace} className="flex-1 flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search street, colony, or landmark..."
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={searchingPlace || !searchQuery.trim()}
            className="py-2.5 px-3.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-colors disabled:opacity-50 shrink-0 shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            {searchingPlace ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Search</span>
          </button>
        </form>

        <button
          type="button"
          onClick={handleGetDeviceLocation}
          disabled={loadingGps}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-teal-700 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60 shrink-0 cursor-pointer"
          title="Use exact device GPS coordinates"
        >
          {loadingGps ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Locking GPS...</span>
            </>
          ) : (
            <>
              <LocateFixed className="w-4 h-4 text-amber-300" />
              <span>Use My Location</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Area Preset Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
        <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
          <Building2 className="w-3 h-3 text-teal-700" />
          <span>Quick Area:</span>
        </span>
        {POPULAR_AREAS.map((area) => (
          <button
            key={area.name}
            type="button"
            onClick={() => handleSelectPresetArea(area)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 border border-slate-200 transition-colors shrink-0 font-medium cursor-pointer"
          >
            {area.name}
          </button>
        ))}
      </div>

      {/* Status Messages & Accuracy Indicator */}
      {gpsSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2 animate-in fade-in shadow-2xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{gpsSuccess}</span>
          </div>
          {accuracyMeters && (
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
              ±{accuracyMeters}m
            </span>
          )}
        </div>
      )}

      {gpsError && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2 animate-in fade-in shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Interactive Map Surface with High-Visibility Area Name Badge Overlay */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 shadow-sm bg-slate-100">
        
        {/* Pinned Area Name Overlay */}
        <div className="absolute top-3 left-3 right-3 z-10 bg-white/95 backdrop-blur-md border border-teal-200/80 rounded-xl p-2.5 shadow-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-ping shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                Pinned Area & Landmark
              </span>
              <p className="text-xs font-bold text-slate-900 truncate">
                {geocodingAddress ? (
                  <span className="text-slate-500 italic flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Resolving address...
                  </span>
                ) : (
                  customAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                )}
              </p>
            </div>
          </div>

          <div className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg shrink-0 border border-slate-200 hidden sm:block">
            {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
          </div>
        </div>

        {/* Leaflet Map Surface */}
        <div ref={mapContainerRef} className="w-full h-72 sm:h-80 z-0 cursor-crosshair" />

        {/* Map helper footer overlay */}
        <div className="absolute bottom-2 left-2 right-2 z-10 bg-black/60 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-[11px] flex items-center justify-between">
          <span>💡 Drag pin or tap map to adjust exact spot</span>
          <span className="font-mono text-[10px] opacity-80 sm:hidden">
            {latitude.toFixed(3)}, {longitude.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Resolved Street Address & Manual Coordinate Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
        <div className="sm:col-span-8">
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>Street Address / Landmark Description</span>
            {geocodingAddress && (
              <span className="text-[10px] text-teal-700 font-normal flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Geocoding...
              </span>
            )}
          </label>
          <input
            type="text"
            value={customAddress}
            onChange={(e) => {
              setCustomAddress(e.target.value);
              onChange(latitude, longitude, e.target.value);
            }}
            placeholder="e.g. 100 Feet Road, Near Metro Pillar 42, Indiranagar"
            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
          />
        </div>

        <div className="sm:col-span-4 flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Latitude
            </label>
            <input
              type="text"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              onBlur={handleManualCoordChange}
              className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-mono text-center font-bold text-slate-700"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Longitude
            </label>
            <input
              type="text"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              onBlur={handleManualCoordChange}
              className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-mono text-center font-bold text-slate-700"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
