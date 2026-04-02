import React from "react";
import MoodIcon from "./MoodIcon";

export const MOODS = [
  { value: "joy", label: "Joy", color: "#FFD600" },
  { value: "surprise", label: "Surprise", color: "#FF9100" },
  { value: "disgust", label: "Disgust", color: "#43A047" },
  { value: "sadness", label: "Sadness", color: "#2196F3" },
  { value: "fear", label: "Fear", color: "#8E24AA" },
  { value: "anger", label: "Anger", color: "#F44336" },
];

export const MoodFaceSVG = ({ emotion, color }: { emotion: string; color: string }) => {
  return <MoodIcon emotion={emotion} size={40} />;
};

export type Mood = { value: string; label: string; color: string };
type MoodPickerProps = {
  onSelect: (mood: Mood) => void;
  disabled?: boolean;
  isMobile?: boolean;
};

const MoodPicker: React.FC<MoodPickerProps> = ({ onSelect, disabled, isMobile }) => {
  if (isMobile) {
    return (
      <div className="w-full flex flex-col items-center">
        <span className="mb-1 text-xs text-gray-700 font-semibold">How are you feeling? Submit your mood:</span>
        <div className="w-full flex flex-row justify-evenly items-center flex-nowrap">
          {MOODS.map((mood) => (
            <div key={mood.value} className="flex flex-col items-center flex-shrink-0">
              <button
                className="hover:scale-110 transition-transform focus:outline-none rounded-full p-1 bg-transparent disabled:opacity-50"
                onClick={() => onSelect(mood)}
                disabled={disabled}
                aria-label={mood.label}
                style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <MoodFaceSVG emotion={mood.value} color={mood.color} />
              </button>
              <span className="mt-0.5 text-xs text-gray-600 font-medium select-none text-center" style={{ width: 40 }}>
                {mood.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // Desktop: original panel style
  return (
    <div className="bg-white/40 rounded-2xl shadow-2xl drop-shadow-2xl px-6 py-4 flex flex-col items-center gap-3 ring-1 ring-white/30 max-w-xl mx-auto">
      <span className="mb-1 text-base text-gray-700 font-semibold">How are you feeling? Submit your mood:</span>
      <div className="flex flex-row justify-evenly items-center w-full">
        {MOODS.map((mood) => (
          <div key={mood.value} className="flex flex-col items-center flex-shrink-0">
            <button
              className="hover:scale-110 transition-transform focus:outline-none rounded-full p-1 bg-transparent disabled:opacity-50"
              onClick={() => onSelect(mood)}
              disabled={disabled}
              aria-label={mood.label}
              style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <MoodFaceSVG emotion={mood.value} color={mood.color} />
            </button>
            <span className="mt-0.5 text-xs text-gray-600 font-medium select-none text-center" style={{ width: 48 }}>
              {mood.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoodPicker; 