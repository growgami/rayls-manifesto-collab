import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/svg+xml'

export default function Icon() {
  return new ImageResponse(
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 210" width="32" height="32">
        <defs>
          <linearGradient id="raylsPurple" x1="99.63" y1="4.76" x2="99.63" y2="207.82" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.81" stopColor="#b49aff" />
          </linearGradient>
          <linearGradient id="raylsYellow" x1="115" y1="-12.82" x2="115" y2="128.6" gradientUnits="userSpaceOnUse">
            <stop offset="0.16" stopColor="#fff" />
            <stop offset="0.78" stopColor="#ecfb3e" />
          </linearGradient>
        </defs>
        <path fill="url(#raylsPurple)" d="m90.53,4.55c.86,0,.77.69.77.69,0,.37-.32.67-.7.63-.15-.01-.29-.03-.44-.04-.22-.02-.27.3-.05.34.11.02.21.04.32.06,0,0,0,0,0,0,56.66,10.24,104.49,43.33,105.89,90.48,0,60.65-62.69,110.62-170.14,110.62-12.85,0-23.26-10.42-23.26-23.27s10.41-23.26,23.26-23.27c108.44,0,145.77-36.9,145.77-73.23,0-52.97-67-76.18-99.54-82.41-.69-.13-1.36-.26-2.02-.37-.08-.01-.15-.03-.23-.04-.57-.1-1.13-.19-1.67-.28-.17-.03-.33-.05-.49-.08-.48-.08-.95-.15-1.41-.22-.13-.02-.26-.04-.38-.06-.58-.08-1.14-.16-1.68-.23-.1-.01-.2-.02-.3-.04-.49-.06-1.12-.13-1.54-.18-.25-.03-.43-.24-.43-.49,0-.27.22-.49.49-.49h.62c1.9.14,3.25.3,5.21.56,2.8.37,5.62.62,8.44.74l13.5.57Z" />
        <path fill="url(#raylsYellow)" d="m227.07,51.36C227.07,5.7,104.6,2.68,63.37,2.68l-.05,1.04c91.19,5.13,139.43,27.09,139.43,43.91,0,28.06-135.87,28.17-176.56,28.17h0c-12.85,0-23.26,10.42-23.26,23.27s10.41,23.26,23.26,23.27h0s0,0,0,0c0,0,0,0,0,0,120.27,0,200.86-32.28,200.86-70.97Z" />
      </svg>
    ),
    {
      ...size,
    }
  )
}
