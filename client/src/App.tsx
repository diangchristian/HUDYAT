import { useState } from 'react'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="flex w-full h-screen flex-col items-center justify-center space-y-4">
        <h1 className='text-6xl font-bold text-center font-body '>WELCOME TO HUDYAT</h1>
        <button className="rounded-xl bg-hudyat-gold px-10 py-3 text-xl font-extrabold tracking-wide text-white shadow-[var(--shadow-button)] transition-transform active:translate-y-1 active:shadow-[0_2px_0_#887041] cursor-pointer font-body">
          CHECK
        </button>
         <button className="rounded-xl bg-hudyat-blue px-10 py-3 text-xl font-extrabold tracking-wide text-white shadow-[0_6px_0_#005a9c] transition-transform active:translate-y-1 active:shadow-[0_2px_0_#005a9c] cursor-pointer font-body">
          TEACHER
        </button>
      </div>
    </>
  )
}

export default App
