'use client';

import React, { useState, useEffect } from 'react';
import { formatRelativeTime } from '../utils/timeUtils';
import { getCountryFlag } from '../utils/geocoding';

export type RecentMood = {
  id: string;
  mood_type: string;
  latitude: number;
  longitude: number;
  created_at: string;
  user_id: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  locationName?: string;
  countryFlag?: string;
};

const MOOD_COLORS: Record<string, string> = {
  joy: "#FFD600",
  surprise: "#FF9100",
  disgust: "#43A047",
  sadness: "#2196F3",
  fear: "#8E24AA",
  anger: "#F44336",
};

const RecentMoodsPanel: React.FC<{ variant?: 'standalone' | 'embedded'; onClose?: () => void }> = ({ variant = 'standalone', onClose }) => {
  const [recentMoods, setRecentMoods] = useState<RecentMood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent moods
  const fetchRecentMoods = async () => {
    try {
      const response = await fetch('/api/mood/recent');
      if (!response.ok) {
        throw new Error('Failed to fetch recent moods');
      }
      
      const data = await response.json();
      
      // Process the data with location names and country flags
      const moodsWithLocation = data.data.map((mood: RecentMood) => {
        const countryFlag = mood.country_name ? getCountryFlag(mood.country_name) : '🌍';
        
        // Construct full location name from components
        let locationName = '';
        if (mood.city_name && mood.state_name && mood.country_name) {
          locationName = `${mood.city_name}, ${mood.state_name}, ${mood.country_name}`;
        } else if (mood.city_name && mood.country_name) {
          locationName = `${mood.city_name}, ${mood.country_name}`;
        } else if (mood.city_name) {
          locationName = mood.city_name;
        } else {
          locationName = `${mood.latitude.toFixed(2)}, ${mood.longitude.toFixed(2)}`;
        }
        
        return {
          ...mood,
          locationName,
          countryFlag
        };
      });
      
      setRecentMoods(moodsWithLocation);
      setError(null);
    } catch (err) {
      console.error('Error fetching recent moods:', err);
      setError('Failed to load recent moods');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRecentMoods();
  }, []);

  // Refresh every 30 seconds and listen for custom refresh events
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecentMoods();
    }, 30000);

    // Listen for custom refresh events
    const handleRefresh = () => {
      fetchRecentMoods();
    };
    
    window.addEventListener('refreshUpdates', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshUpdates', handleRefresh);
    };
  }, []);

  // Update relative times every second
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update relative times
      setRecentMoods(prev => [...prev]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const containerClasses = variant === 'standalone' 
    ? "bg-white/40 backdrop-blur-sm rounded-2xl shadow-2xl drop-shadow-2xl ring-1 ring-white/30 p-4 w-80 max-h-96 overflow-hidden"
    : "w-full overflow-hidden";

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500 text-sm">Loading recent moods...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-center h-32">
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Recent Moods</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close recent moods"
            >
              <span className="text-gray-500 text-lg leading-none">×</span>
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2 pb-1">
        {recentMoods.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No recent moods
          </div>
        ) : (
          recentMoods.slice(0, 5).map((mood) => (
            <div key={mood.id} className="flex flex-col px-1 py-1 rounded-lg hover:bg-gray-50 transition-colors">
              {/* First line: mood icon, mood type, time ago */}
              <div className="flex items-center gap-2">
                <span className="text-lg" style={{ color: MOOD_COLORS[mood.mood_type] || '#666' }}>●</span>
                <span className="text-sm font-semibold" style={{ color: MOOD_COLORS[mood.mood_type] || '#666' }}>
                  {mood.mood_type.charAt(0).toUpperCase() + mood.mood_type.slice(1)}
                </span>
                <span className="text-xs text-gray-500 ml-auto">{formatRelativeTime(mood.created_at)}</span>
              </div>
              {/* Second line: flag and location name */}
              <div className="flex items-center gap-1 ml-6 text-xs text-gray-700 break-words">
                <span>{mood.countryFlag}</span>
                <span className="truncate">{mood.locationName}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentMoodsPanel; 