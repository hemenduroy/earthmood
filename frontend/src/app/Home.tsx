import React, { useState, useEffect, useRef } from "react";
import WorldMap from "../components/WorldMap";
import MoodPicker, { MOODS, MoodFaceSVG } from "../components/MoodPicker";
import FaviconIcon from "../components/FaviconIcon";
import RecentMoodsPanel from "../components/RecentMoodsPanel";
import "./Home.css";
import { Activity } from "lucide-react";

// Shared hook for global stats - fetches once and shares data
const useGlobalStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const response = await fetch('/api/mood/global?timeRange=1 year');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching global stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
};

const MOOD_DURATION = 2 * 60 * 1000; // 2 minutes
const MOOD_STORAGE_KEY = "moodio_last_mood";
const MOOD_TIME_KEY = "moodio_last_time";
const MOOD_LAT_KEY = "moodio_last_lat";
const MOOD_LNG_KEY = "moodio_last_lng";

const Home: React.FC = () => {
  // Mood submission state
  const [loading, setLoading] = useState(false);
  const [nextAllowed, setNextAllowed] = useState<number | null>(null);
  const [timer, setTimer] = useState(0);
  const [recentMoodsOpen, setRecentMoodsOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const startOpen = useRef<boolean>(false);
  const handleRef = useRef<HTMLButtonElement>(null);

  // On mount, check localStorage for last submission
  useEffect(() => {
    const lastMood = localStorage.getItem(MOOD_STORAGE_KEY);
    const lastTime = localStorage.getItem(MOOD_TIME_KEY);
    const lastLat = localStorage.getItem(MOOD_LAT_KEY);
    const lastLng = localStorage.getItem(MOOD_LNG_KEY);
    if (lastMood && lastTime && lastLat && lastLng) {
      const time = parseInt(lastTime, 10);
      const now = Date.now();
      if (now - time < MOOD_DURATION) {
        setNextAllowed(time + MOOD_DURATION);
      }
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!nextAllowed) return;
    const interval = setInterval(() => {
      const diff = nextAllowed - Date.now();
      setTimer(diff > 0 ? diff : 0);
      if (diff <= 0) {
        setNextAllowed(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextAllowed]);

  // Handle mood selection
  const handleMoodSelect = (mood: any) => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Submit mood to database
            const response = await fetch('/api/mood', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                moodType: mood.value,
                userId: 'anonymous'
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to submit mood');
            }

            // Store in localStorage
            localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(mood));
            localStorage.setItem(MOOD_TIME_KEY, Date.now().toString());
            localStorage.setItem(MOOD_LAT_KEY, position.coords.latitude.toString());
            localStorage.setItem(MOOD_LNG_KEY, position.coords.longitude.toString());
            setNextAllowed(Date.now() + MOOD_DURATION);
            setLoading(false);

            // Trigger recent moods panel refresh after a short delay
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refreshUpdates'));
            }, 1000);
          } catch (error) {
            alert('Failed to submit your mood. Please try again.');
            setLoading(false);
          }
        },
        (error) => {
          alert("Could not get your location. Please allow location access.");
          setLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  };

  // Format timer as MM:SS
  const formatTimer = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Global stats
  const { stats, loading: statsLoading } = useGlobalStats();

  return (
    <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-100 overflow-hidden">
      {/* Header */}
      <header className="w-full sticky top-0 z-20 bg-white/90 shadow flex items-center justify-between px-4 md:px-6 py-3 md:py-2">
        <div className="flex items-center gap-2 md:gap-3">
          <FaviconIcon size={40} />
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900">earthmood</h1>
        </div>
        {/* Global Stats */}
        <div className="hidden md:flex gap-4 items-center text-base font-semibold">
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-extrabold tracking-tight text-black">Global Mood</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-mono">
                {statsLoading ? "..." : (stats?.worldCoverage?.percentage?.toFixed(3) ?? "0.000")}%
              </span>
              <span className="text-sm font-medium text-gray-700">Coverage</span>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div className="worldCoverageBar" style={{ width: `${Math.min((stats?.worldCoverage?.percentage ?? 0), 100)}%` }} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {MOODS.map((mood: { value: string; label: string; color: string }) => (
              <span key={mood.value} className="flex flex-col items-center">
                <MoodFaceSVG emotion={mood.value} color={mood.color} />
                <span className="text-xs mt-0.5 font-semibold" style={{ color: mood.color }}>
                  {statsLoading ? "..." : (stats?.moodDistribution?.[mood.value]?.percentage?.toFixed(3) ?? "0.000")}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </header>
      {/* Global Stats Bar for mobile */}
      <div className="block md:hidden w-full px-2 py-2 bg-white/90 shadow-sm flex flex-col items-center gap-1">
        <div className="w-full flex justify-center mb-1">
          <span className="text-xs font-semibold text-gray-700">Global Mood</span>
        </div>
        <div className="flex gap-2 items-center justify-center w-full">
          {MOODS.map((mood) => (
            <div key={mood.value} className="flex flex-col items-center w-12">
              <MoodFaceSVG emotion={mood.value} color={mood.color} />
              <span className="text-xs font-semibold" style={{ color: mood.color }}>
                {statsLoading ? "-" : (stats?.moodDistribution?.[mood.value]?.percentage?.toFixed(3) ?? "-")}%
              </span>
            </div>
          ))}
        </div>
        <div className="w-full flex justify-center mt-1">
          <span className="text-xs text-gray-500 font-medium">
            Global Coverage: {statsLoading ? "-" : (stats?.worldCoverage?.percentage?.toFixed(3) ?? "-")}%
          </span>
        </div>
      </div>
      {/* Main Content */}
      <main className="relative flex-1 min-h-0 flex flex-col items-stretch justify-stretch">
        <div className="flex-1 flex justify-center items-center min-h-0 min-w-0">
          <div className="relative w-full max-w-5xl h-full min-h-0">
            <WorldMap />
          </div>
          {/* Recent Moods Panel - Desktop ONLY */}
          <div className="hidden md:block absolute top-4 right-4 z-10">
            <RecentMoodsPanel />
          </div>
        </div>
        {/* Recent Moods Panel - Mobile ONLY */}
        {recentMoodsOpen && (
          <>
            {/* Backdrop for closing */}
            <div 
              className="fixed inset-0 z-40 bg-black/20 md:hidden"
              onClick={() => setRecentMoodsOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 z-50 flex justify-end items-center pointer-events-none md:hidden">
              <div
                className="relative w-80 max-w-full rounded-xl p-2 mr-4 transition-transform duration-300 pointer-events-auto translate-x-0"
                style={{ willChange: 'transform' }}
                ref={sheetRef}
              >
                <RecentMoodsPanel onClose={() => setRecentMoodsOpen(false)} />
              </div>
            </div>
          </>
        )}
        {/* Floating handle button (mobile only) */}
        {!recentMoodsOpen && (
          <button
            ref={handleRef}
            className="fixed z-50 right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/80 shadow-xl border border-gray-200 flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all md:hidden"
            aria-label="Show recent moods"
            onClick={() => setRecentMoodsOpen(true)}
          >
            <Activity size={28} color="#22c55e" />
          </button>
        )}
        {/* Mood Picker */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-12 z-10 flex flex-col items-center w-full">
          <MoodPicker onSelect={handleMoodSelect} disabled={!!nextAllowed || loading} />
          <div className="mt-2 min-h-[20px] flex items-center justify-center w-full">
            {loading && <span className="block text-xs text-gray-500">Getting your location...</span>}
            {!loading && !!nextAllowed && (
              <span className="block text-xs text-gray-500">
                You can change your mood in {formatTimer(timer)}
              </span>
            )}
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="w-full py-2 flex justify-center text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} earthmood created by Hemendu Roy
      </footer>
    </div>
  );
};

export default Home; 