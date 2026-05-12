import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav>
      <div className="fixed top-4 font1 flex justify-between items-center p-4 text-[#F0FAF4] w-full px-15 z-50">
        <div className='flex items-center shrink-0'>
          <h1 className='font-semibold text-[30px] tracking-wide text-[#F0FAF4]'>Skill</h1>
          <h1 className='text-[#3EE07F] text-[30px]'>Sync</h1>
        </div>
        <div className='flex gap-1 items-center justify-between px-4 py-2.5 h-13 rounded-full 
        backdrop-blur-md bg-[#0F2027]/60 border border-[#28623A]/30 
        shadow-[0_8px_32px_rgba(40,98,58,0.15)]
        transition-all duration-300'>
          <Link className='px-3.5 py-1.5 text-[16px] font-medium tracking-wide 
text-[#7BAF8E] hover:text-[#F0FAF4] 
transition-colors duration-200 cursor-pointer relative group' to="/">Home</Link>
          <Link className='px-3.5 py-1.5 text-[16px] font-medium tracking-wide 
text-[#7BAF8E] hover:text-[#F0FAF4] 
transition-colors duration-200 cursor-pointer relative group' to="/features">Features</Link>
          <Link className='px-3.5 py-1.5 text-[16px] font-medium tracking-wide 
text-[#7BAF8E] hover:text-[#F0FAF4] 
transition-colors duration-200 cursor-pointer relative group' to="/how-it-works">How It Works</Link>
          <Link className='px-3.5 py-1.5 text-[16px] font-medium tracking-wide 
text-[#7BAF8E] hover:text-[#F0FAF4] 
transition-colors duration-200 cursor-pointer relative group' to="/teams">Teams</Link>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <Link className='px-3.5 py-1.5 text-[16px] font-medium text-[#7BAF8E] 
hover:text-[#F0FAF4] transition-colors duration-200 cursor-pointer' to="/login">Login</Link>
          <Link className='px-4 py-1.5 rounded-full text-[16px] font-semibold tracking-wide
bg-gradient-to-r from-[#28623A] to-[#1A4D2E] text-[#F0FAF4]
hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(62,224,127,0.25)]
transition-all duration-200 cursor-pointer' to="/register">Get Started</Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar