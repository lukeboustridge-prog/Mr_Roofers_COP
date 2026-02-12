import type { Config } from "tailwindcss";

const config: Config = {
    // Dark mode set to media - app doesn't use dark theme toggle
    // This is the default behavior and avoids generating dark: variant classes
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		typography: {
  			DEFAULT: {
  				css: {
  					// Legislative heading hierarchy: tighter spacing, formal weight
  					'h2': {
  						fontWeight: '700',
  						marginTop: '2em',
  						marginBottom: '0.75em',
  						borderBottom: '1px solid rgb(226 232 240)', // slate-200
  						paddingBottom: '0.5em',
  					},
  					'h3': {
  						fontWeight: '600',
  						marginTop: '1.75em',
  						marginBottom: '0.5em',
  					},
  					'h4, h5, h6': {
  						fontWeight: '600',
  						marginTop: '1.5em',
  						marginBottom: '0.5em',
  					},
  					// Wider paragraph spacing for formal readability
  					'p': {
  						marginTop: '1em',
  						marginBottom: '1em',
  						lineHeight: '1.75',
  					},
  					// Tables with subtle borders for specification tables
  					'table': {
  						borderCollapse: 'collapse',
  						width: '100%',
  					},
  					'th': {
  						backgroundColor: 'rgb(248 250 252)', // slate-50
  						fontWeight: '600',
  						padding: '0.75em 1em',
  						borderBottom: '2px solid rgb(226 232 240)',
  						textAlign: 'left' as const,
  					},
  					'td': {
  						padding: '0.75em 1em',
  						borderBottom: '1px solid rgb(241 245 249)', // slate-100
  					},
  					// Lists with formal spacing
  					'ul, ol': {
  						paddingLeft: '1.5em',
  					},
  					'li': {
  						marginTop: '0.375em',
  						marginBottom: '0.375em',
  					},
  					// Figure captions
  					'figcaption': {
  						fontStyle: 'normal',
  						fontSize: '0.875em',
  						color: 'rgb(100 116 139)', // slate-500
  						textAlign: 'center',
  						marginTop: '0.5em',
  					},
  					// Blockquotes for legislative references
  					'blockquote': {
  						borderLeftColor: 'rgb(148 163 184)', // slate-400
  						borderLeftWidth: '3px',
  						fontStyle: 'normal',
  						color: 'rgb(71 85 105)', // slate-600
  						paddingLeft: '1.25em',
  					},
  					// Max image width within prose
  					'img': {
  						marginTop: '1.5em',
  						marginBottom: '1.5em',
  						borderRadius: '0.5rem',
  					},
  				},
  			},
  			// Slate variant overrides (matches prose-slate)
  			slate: {
  				css: {
  					'--tw-prose-body': 'rgb(51 65 85)',        // slate-700
  					'--tw-prose-headings': 'rgb(15 23 42)',    // slate-900
  					'--tw-prose-links': 'hsl(var(--primary))',
  					'--tw-prose-bold': 'rgb(30 41 59)',        // slate-800
  					'--tw-prose-counters': 'rgb(100 116 139)', // slate-500
  					'--tw-prose-bullets': 'rgb(148 163 184)',  // slate-400
  					'--tw-prose-hr': 'rgb(226 232 240)',       // slate-200
  					'--tw-prose-quotes': 'rgb(71 85 105)',     // slate-600
  					'--tw-prose-quote-borders': 'rgb(148 163 184)', // slate-400
  					'--tw-prose-th-borders': 'rgb(226 232 240)',    // slate-200
  					'--tw-prose-td-borders': 'rgb(241 245 249)',    // slate-100
  				},
  			},
  		},
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;
