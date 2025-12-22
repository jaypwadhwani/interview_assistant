import { ColorScheme } from '../utils/theme';

interface ThemeSelectorProps {
  onSubmit: (theme: ColorScheme) => void;
}

const themes: { scheme: ColorScheme; name: string; description: string; preview: string }[] = [
  { 
    scheme: 'purple', 
    name: 'Lavender', 
    description: 'Soft purple accents',
    preview: 'bg-purple-100 border-purple-200'
  },
  { 
    scheme: 'blue', 
    name: 'Sky', 
    description: 'Calm blue tones',
    preview: 'bg-blue-100 border-blue-200'
  },
  { 
    scheme: 'green', 
    name: 'Sage', 
    description: 'Natural green hues',
    preview: 'bg-emerald-100 border-emerald-200'
  },
  { 
    scheme: 'orange', 
    name: 'Apricot', 
    description: 'Warm orange shades',
    preview: 'bg-orange-100 border-orange-200'
  },
  { 
    scheme: 'teal', 
    name: 'Mint', 
    description: 'Fresh teal tones',
    preview: 'bg-teal-100 border-teal-200'
  },
];

export const ThemeSelector = ({ onSubmit }: ThemeSelectorProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">Choose Your Theme</h1>
          <p className="text-gray-600 text-lg">Select a subtle color accent</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map(({ scheme, name, description, preview }) => (
            <button
              key={scheme}
              onClick={() => onSubmit(scheme)}
              className="group relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-gray-200/60 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              {/* Preview Color */}
              <div className={`${preview} h-24 rounded-2xl mb-6 border-2 shadow-sm`}></div>
              
              {/* Theme Name */}
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{name}</h2>
              <p className="text-gray-500 mb-6">{description}</p>
              
              {/* Sample Elements Preview */}
              <div className="space-y-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-${scheme === 'purple' ? 'purple' : scheme === 'blue' ? 'blue' : scheme === 'green' ? 'emerald' : scheme === 'orange' ? 'orange' : 'teal'}-500 w-3/4 rounded-full`}></div>
                </div>
                <div className="flex gap-2">
                  <div className={`flex-1 h-8 bg-${scheme === 'purple' ? 'purple' : scheme === 'blue' ? 'blue' : scheme === 'green' ? 'emerald' : scheme === 'orange' ? 'orange' : 'teal'}-600 rounded-xl`}></div>
                  <div className="w-8 h-8 bg-gray-100 rounded-xl"></div>
                </div>
              </div>

              {/* Hover Indicator */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
