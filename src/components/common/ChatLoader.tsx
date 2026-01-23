import React from 'react';

type ChatLoaderProps = {
  label?: string;
  size?: number;
};

export default function ChatLoader({ label = 'Loading…', size = 72 }: ChatLoaderProps) {
  const bubbleColor = '#2563EB'; // tailwind blue-600
  const dotColor = '#60A5FA'; // tailwind blue-400

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-gray-600">
      <svg
        width={size}
        height={(size * 3) / 4}
        viewBox="0 0 120 90"
        role="img"
        aria-label={label}
      >
        <title>{label}</title>
        {/* Chat bubble outline */}
        <path
          d="M20 15h80a10 10 0 0 1 10 10v30a10 10 0 0 1-10 10H56l-16 12v-12H20a10 10 0 0 1-10-10V25a10 10 0 0 1 10-10z"
          fill="none"
          stroke={bubbleColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="350"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="350;0;350"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </path>

        {/* Typing dots */}
        <g transform="translate(36,38)">
          <circle cx="0" cy="0" r="6" fill={dotColor}>
            <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" />
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 0 -6; 0 0"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="24" cy="0" r="6" fill={dotColor}>
            <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" begin="0.15s" repeatCount="indefinite" />
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 0 -6; 0 0"
              dur="1s"
              begin="0.15s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="48" cy="0" r="6" fill={dotColor}>
            <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" begin="0.3s" repeatCount="indefinite" />
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 0 -6; 0 0"
              dur="1s"
              begin="0.3s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}
