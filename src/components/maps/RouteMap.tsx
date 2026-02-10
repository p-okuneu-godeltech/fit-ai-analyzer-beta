"use client";

import { useEffect, useMemo } from "react";
import type { LatLngTuple } from "leaflet";
import { latLngBounds } from "leaflet";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

import type { RoutePolyline } from "../../lib/fit/route";
import styles from "./RouteMap.module.css";

type RouteMapProps = {
  polyline: RoutePolyline;
};

function FitBounds({ polyline }: { polyline: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (polyline.length < 2) return;

    const bounds = latLngBounds(polyline);
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17 });
  }, [map, polyline]);

  return null;
}

export default function RouteMap({ polyline }: RouteMapProps) {
  const leafletPolyline = useMemo(() => polyline as unknown as LatLngTuple[], [polyline]);

  const initialCenter = useMemo<LatLngTuple>(() => {
    if (leafletPolyline.length > 0) return leafletPolyline[0];
    return [0, 0];
  }, [leafletPolyline]);

  const start = leafletPolyline[0];
  const end = leafletPolyline[leafletPolyline.length - 1];

  return (
    <div className={styles.container}>
      <MapContainer
        className={styles.map}
        center={initialCenter}
        zoom={13}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {leafletPolyline.length >= 2 && (
          <>
            <FitBounds polyline={leafletPolyline} />
            <Polyline positions={leafletPolyline} pathOptions={{ color: "#2563eb", weight: 4 }} />
            {start && (
              <CircleMarker
                center={start}
                radius={6}
                pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 1 }}
              />
            )}
            {end && (
              <CircleMarker
                center={end}
                radius={6}
                pathOptions={{ color: "#dc2626", fillColor: "#dc2626", fillOpacity: 1 }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
