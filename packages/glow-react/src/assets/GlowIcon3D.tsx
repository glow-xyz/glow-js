import React from "react";

export const GlowIcon3D = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="25"
    height="24"
    fill="none"
    viewBox="0 0 25 24"
    {...props}
  >
    <g fillRule="evenodd" clipRule="evenodd" filter="url(#filter0_d_1073_9641)">
      <path
        fill="url(#paint0_linear_1073_9641)"
        d="M19.513 17.129A9.968 9.968 0 0112.5 20a9.967 9.967 0 01-7.001-2.86c4.095-3.225 9.915-3.229 14.014-.011zm.116-.116A9.968 9.968 0 0022.5 10a9.968 9.968 0 00-2.858-7c-3.227 4.107-3.231 9.915-.013 14.013zm-.1-14.127c-4.106 3.234-9.944 3.23-14.045-.012A9.968 9.968 0 0112.5 0a9.968 9.968 0 017.028 2.886zm-14.155.098A9.968 9.968 0 002.5 10a9.968 9.968 0 002.886 7.028c3.234-4.105 3.23-9.943-.012-14.044z"
      />
      <path
        fill="url(#paint1_radial_1073_9641)"
        d="M19.513 17.129A9.968 9.968 0 0112.5 20a9.967 9.967 0 01-7.001-2.86c4.095-3.225 9.915-3.229 14.014-.011zm.116-.116A9.968 9.968 0 0022.5 10a9.968 9.968 0 00-2.858-7c-3.227 4.107-3.231 9.915-.013 14.013zm-.1-14.127c-4.106 3.234-9.944 3.23-14.045-.012A9.968 9.968 0 0112.5 0a9.968 9.968 0 017.028 2.886zm-14.155.098A9.968 9.968 0 002.5 10a9.968 9.968 0 002.886 7.028c3.234-4.105 3.23-9.943-.012-14.044z"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_1073_9641"
        width="23.645"
        height="23.645"
        x="0.677"
        y="0"
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset dy="1.823" />
        <feGaussianBlur stdDeviation="0.911" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
        <feBlend
          in2="BackgroundImageFix"
          mode="overlay"
          result="effect1_dropShadow_1073_9641"
        />
        <feBlend
          in="SourceGraphic"
          in2="effect1_dropShadow_1073_9641"
          result="shape"
        />
      </filter>
      <linearGradient
        id="paint0_linear_1073_9641"
        x1="12.5"
        x2="12.5"
        y1="0"
        y2="20"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#fff" />
        <stop offset="1" stopColor="#fff" stopOpacity="0.7" />
      </linearGradient>
      <radialGradient
        id="paint1_radial_1073_9641"
        cx="0"
        cy="0"
        r="1"
        gradientTransform="matrix(0 10 -10 0 12.5 10)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.906" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#fff" />
      </radialGradient>
    </defs>
  </svg>
);
