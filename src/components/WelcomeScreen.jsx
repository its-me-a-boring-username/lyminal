import { MAP_BG, FONTS } from "../constants.js";
import { TriangleLogo } from "./TriangleLogo.jsx";

export function WelcomeScreen({ setStep, DevReset }) {
  return (
    <>
    <DevReset />
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden" style={{fontFamily:"'Inter', sans-serif", animation:"fadeSlideUp 0.45s ease-out"}}>
      <style>{FONTS}</style>
      <DevReset />
      <div className="absolute inset-0" style={{backgroundImage:`url(${MAP_BG})`, backgroundSize:"cover", backgroundPosition:"center"}}/>

      {/* Content card */}
      <div className="relative z-10 w-full mx-auto text-left" style={{maxWidth:"530px"}}>
        <div className="px-12 py-10" style={{background:"rgba(250,248,245,0.95)", border:"1px solid #ddd3c5", boxShadow:"0 8px 40px rgba(0,0,0,0.18)"}}>

          {/* Logo */}
          <div className="flex justify-center mb-5">
            <TriangleLogo size={80} />
          </div>

          <h1 style={{fontFamily:"'Playfair Display', serif", fontSize:"2.4rem", fontWeight:600, color:"#1c1410", lineHeight:1.2, textAlign:"center"}} className="mb-3">
            Find Your <em style={{color:"#b5472a"}}>Focus</em>
          </h1>
          <p className="text-sm mb-7 leading-relaxed" style={{color:"#4a3828", fontWeight:300}}>
            Map the areas of your life, discover which ones support others, and find where to focus first.
          </p>
          <div className="space-y-2.5 mb-8">
            {[
              ["Define your spheres","The major areas of your life"],
              ["Add goals to each","What you want to achieve"],
              ["Map the relationships","How each area influences others"],
              ["See your priorities","Where to focus first"],
            ].map(([title, desc], i) => (
              <div key={title} className="flex gap-3 items-start">
                <span className="text-xs font-semibold mt-0.5 w-4 flex-shrink-0" style={{color:"#b5472a"}}>{i+1}.</span>
                <div className="text-sm" style={{color:"#1c1410"}}>
                  <span className="font-medium">{title}</span>
                  <span style={{color:"#5c4e40"}}> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep("intro-spheres")}
            style={{background:"#b5472a", color:"#faf8f5", fontFamily:"'Inter', sans-serif", fontWeight:500, letterSpacing:"0.06em", fontSize:"0.8rem"}}
            className="w-full py-3.5 transition-opacity hover:opacity-85"
          >
            GET STARTED →
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
