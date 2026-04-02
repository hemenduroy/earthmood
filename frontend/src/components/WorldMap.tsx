'use client';
import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Map as LeafletMap } from 'leaflet';
import { useRef } from 'react';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

// Import CSS only on client side
if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css');
}

export type MoodDot = {
  lat: number;
  lng: number;
  color: string;
  timestamp?: string;
};

type WorldMapProps = {
  moodDots?: MoodDot[];
  isMobile?: boolean;
};

const MOOD_COLORS: Record<string, string> = {
  joy: "#FFD600",
  surprise: "#FF9100", 
  disgust: "#43A047",
  sadness: "#2196F3",
  fear: "#8E24AA",
  anger: "#F44336",
};

const WorldMap: React.FC<WorldMapProps> = ({ moodDots = [], isMobile = false }) => {
  const [globalMoodData, setGlobalMoodData] = useState<MoodDot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Set client state on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch global mood data
  useEffect(() => {
    const fetchGlobalMoodData = async () => {
      try {
        const response = await fetch('/api/mood?bounds=-90,-180,90,180&zoom=3&timeRange=1 year');
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            // Filter to show only the most recent mood type per grid cell
            const moodMap = new Map();
            data.data.forEach((item: any) => {
              if (item.center_lat != null && item.center_lng != null) {
                const gridKey = item.grid_id;
                if (!moodMap.has(gridKey)) {
                  moodMap.set(gridKey, item);
                }
              }
            });
            
            const moodDots = Array.from(moodMap.values()).map((item: any) => ({
              lat: parseFloat(item.center_lat),
              lng: parseFloat(item.center_lng),
              color: MOOD_COLORS[item.mood_type] || '#666'
            }));
            setGlobalMoodData(moodDots);
          }
        }
      } catch (error) {
        console.error('Failed to fetch global mood data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalMoodData();
  }, []);

  // Combine global data with user's mood and ensure user's mood appears on top
  const allMoodDots = [...globalMoodData, ...moodDots];

  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-transparent">
      {!isClient ? (
        <div className="w-full h-full flex items-center justify-center bg-transparent">
          <div className="text-gray-500">Loading map...</div>
        </div>
      ) : (
        <MapContainer
          center={[20, 0]}
          zoom={isMobile ? 1 : 2}
          minZoom={isMobile ? 1 : 2}
          maxZoom={5}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
          attributionControl={false}
          doubleClickZoom={true}
          scrollWheelZoom={true}
          dragging={true}
          touchZoom={true}
          boxZoom={false}
          keyboard={false}
          maxBounds={[[-90, -180], [90, 180]]}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            noWrap={true}
          />
          {allMoodDots.map((dot, i) => (
            <CircleMarker
              key={i}
              center={[dot.lat, dot.lng]}
              radius={6}
              fillColor={dot.color}
              color={dot.color}
              weight={0}
              opacity={0.8}
              fillOpacity={0.8}
            />
          ))}
        </MapContainer>
      )}
    </div>
  );
};

export default WorldMap; 