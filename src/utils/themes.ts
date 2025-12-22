export type ColorScheme = 'purple' | 'blue' | 'green' | 'orange' | 'rose';

export interface ThemeColors {
  name: string;
  gradient: {
    from: string;
    via: string;
    to: string;
  };
  primary: {
    from: string;
    to: string;
  };
  accent: string;
  text: {
    primary: string;
    secondary: string;
  };
  button: {
    gradient: {
      from: string;
      to: string;
    };
    hover: {
      from: string;
      to: string;
    };
    shadow: string;
  };
}

export const themes: Record<ColorScheme, ThemeColors> = {
  purple: {
    name: 'Purple & Indigo',
    gradient: {
      from: 'from-slate-900',
      via: 'via-purple-900',
      to: 'to-slate-900',
    },
    primary: {
      from: 'from-indigo-500',
      to: 'to-purple-600',
    },
    accent: 'purple',
    text: {
      primary: 'text-white',
      secondary: 'text-purple-200',
    },
    button: {
      gradient: {
        from: 'from-indigo-600',
        to: 'to-purple-600',
      },
      hover: {
        from: 'from-indigo-500',
        to: 'to-purple-500',
      },
      shadow: 'shadow-indigo-500/50',
    },
  },
  blue: {
    name: 'Ocean Blue',
    gradient: {
      from: 'from-slate-900',
      via: 'via-blue-900',
      to: 'to-slate-900',
    },
    primary: {
      from: 'from-cyan-500',
      to: 'to-blue-600',
    },
    accent: 'blue',
    text: {
      primary: 'text-white',
      secondary: 'text-cyan-200',
    },
    button: {
      gradient: {
        from: 'from-cyan-600',
        to: 'to-blue-600',
      },
      hover: {
        from: 'from-cyan-500',
        to: 'to-blue-500',
      },
      shadow: 'shadow-blue-500/50',
    },
  },
  green: {
    name: 'Emerald Green',
    gradient: {
      from: 'from-slate-900',
      via: 'via-emerald-900',
      to: 'to-slate-900',
    },
    primary: {
      from: 'from-green-500',
      to: 'to-emerald-600',
    },
    accent: 'emerald',
    text: {
      primary: 'text-white',
      secondary: 'text-emerald-200',
    },
    button: {
      gradient: {
        from: 'from-green-600',
        to: 'to-emerald-600',
      },
      hover: {
        from: 'from-green-500',
        to: 'to-emerald-500',
      },
      shadow: 'shadow-emerald-500/50',
    },
  },
  orange: {
    name: 'Sunset Orange',
    gradient: {
      from: 'from-slate-900',
      via: 'via-orange-900',
      to: 'to-slate-900',
    },
    primary: {
      from: 'from-amber-500',
      to: 'to-orange-600',
    },
    accent: 'orange',
    text: {
      primary: 'text-white',
      secondary: 'text-orange-200',
    },
    button: {
      gradient: {
        from: 'from-amber-600',
        to: 'to-orange-600',
      },
      hover: {
        from: 'from-amber-500',
        to: 'to-orange-500',
      },
      shadow: 'shadow-orange-500/50',
    },
  },
  rose: {
    name: 'Rose Pink',
    gradient: {
      from: 'from-slate-900',
      via: 'via-rose-900',
      to: 'to-slate-900',
    },
    primary: {
      from: 'from-pink-500',
      to: 'to-rose-600',
    },
    accent: 'rose',
    text: {
      primary: 'text-white',
      secondary: 'text-pink-200',
    },
    button: {
      gradient: {
        from: 'from-pink-600',
        to: 'to-rose-600',
      },
      hover: {
        from: 'from-pink-500',
        to: 'to-rose-500',
      },
      shadow: 'shadow-rose-500/50',
    },
  },
};

