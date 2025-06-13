'use client'

import localFont from "next/font/local"
import { useTheme } from "@/context/ThemeContext"

const Printvetica = localFont({
    src: '../../public/fonts/Printvetica.otf'
})

export default function Navbar() {
    const { isDarkMode, toggleTheme } = useTheme()

    return (
        <div className={`flex items-center justify-center h-20 transition-colors duration-300 ${
            isDarkMode ? 'bg-[#1D1D1D]' : 'bg-[#D9D9D9]'
        }`}>
            <nav className={`${Printvetica.className} flex justify-between items-center px-6 text-2xl w-full ${
                isDarkMode ? 'text-white' : 'text-black'
            }`}> 
                <div className="flex justify-between gap-3 md:gap-10">
                    <h1>IFSOL</h1>
                    <a href="https://x.com/ifsolxyz">X</a>
                </div>
                <div className="flex justify-center gap-x-10 absolute left-1/2 -translate-x-1/2 translate-y-[1px]">
                </div>
                <div className="flex gap-x-2 md:gap-x-4 items-center">
                    <h1 className="text-base md:text-2xl">{isDarkMode 
                            ? "Do not press!" 
                            : (
                                <>
                                    <span>You like</span>
                                    <br />
                                    <span>to gamble dont you?</span>
                                </>
                            )
                        }</h1>
                    <button 
                        onClick={toggleTheme} 
                        className={`h-[45px] w-[45px] rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-white' : 'bg-[#BA0101]'}`}
                        aria-label="Toggle dark mode"
                    >
                    </button>
                </div>
            </nav>
        </div>
    )
}