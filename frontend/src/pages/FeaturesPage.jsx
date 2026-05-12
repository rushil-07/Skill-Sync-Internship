import React, { useState } from 'react';

const FeaturesPage = () => {
    // State for toggling the AI View in the main Hero Card
    const [isAiView, setIsAiView] = useState(true);

    return (
        <div className="min-h-screen bg-[#0F2027] text-white selection:bg-[#3EE07F]/30 pb-32">
            
            {/* Hero Header Section */}
            <div className="pt-32 pb-20 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
                <div className="flex flex-col gap-6 w-full max-w-4xl">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#F0FAF4] leading-tight">
                        Project Management,<br />
                        <span className="flex items-center gap-4 flex-wrap mt-2">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3EE07F] to-[#7BAF8E]">
                                Powered by Intelligence.
                            </span>
                            
                            {/* Refined AI Sparkle Icon */}
                            <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
                                <div className="absolute inset-0 bg-[#3EE07F]/20 blur-xl rounded-full"></div>
                                <svg className="absolute w-10 h-10 text-[#3EE07F] animate-[spin_8s_linear_infinite]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
                                </svg>
                                <svg className="absolute top-1 right-1 w-4 h-4 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" />
                                </svg>
                            </div>
                        </span>
                    </h1>
                    <p className="text-[#7BAF8E] text-lg md:text-xl max-w-2xl font-light leading-relaxed">
                        Experience a new standard of operational efficiency with AI-driven insights, automated workflows, and predictive analytics.
                    </p>
                </div>
            </div>

            {/* Asymmetrical Bento Grid */}
            <section className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto w-full">
                
                {/* Grid Architecture:
                  Mobile: 1 column
                  Tablet (md): 2 columns
                  Desktop (lg): 3 columns
                */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    
                    {/* CARD 1: Smart Team Assembly (The 2x2 Hero Card) */}
                    <div className="group relative col-span-1 md:col-span-2 lg:row-span-2 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent border border-white/10 p-8 flex flex-col overflow-hidden transition-all duration-500 hover:border-[#3EE07F]/40 hover:shadow-[0_0_40px_rgba(62,224,127,0.1)] min-h-[450px] lg:min-h-[600px]">
                        
                        {/* Header & Toggle */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8 relative z-20">
                            <div className="max-w-md">
                                <h3 className="text-2xl font-bold text-white mb-3">Smart Team Assembly</h3>
                                <p className="text-[#7BAF8E] text-sm leading-relaxed">AI automatically suggests optimal team compositions based on required skills, availability, and past collaboration success rates.</p>
                            </div>
                            
                            {/* UI/UX Refined Segmented Control */}
                            <div className="flex items-center p-1 bg-black/40 rounded-full border border-white/10 shrink-0">
                                <button 
                                    onClick={() => setIsAiView(false)}
                                    className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300 ${!isAiView ? 'bg-white/10 text-white shadow-sm' : 'text-[#7BAF8E] hover:text-white'}`}
                                >
                                    Standard
                                </button>
                                <button 
                                    onClick={() => setIsAiView(true)}
                                    className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300 flex items-center gap-2 ${isAiView ? 'bg-[#3EE07F]/20 text-[#3EE07F] shadow-[0_0_15px_rgba(62,224,127,0.2)]' : 'text-[#7BAF8E] hover:text-[#3EE07F]'}`}
                                >
                                    {isAiView && <span className="w-1.5 h-1.5 rounded-full bg-[#3EE07F] animate-pulse"></span>}
                                    AI View
                                </button>
                            </div>
                        </div>

                        {/* Interactive Visual Area */}
                        <div className="flex-grow w-full rounded-2xl bg-black/20 border border-white/5 relative overflow-hidden flex items-center justify-center p-6">
                            
                            {/* Subtle Grid Background */}
                            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                            {!isAiView ? (
                                /* Standard List UI */
                                <div className="w-full max-w-sm flex flex-col gap-3 relative z-10 animate-in fade-in zoom-in-95 duration-300">
                                    {[
                                        { name: "Sarah J.", role: "Senior Frontend" },
                                        { name: "Mike T.", role: "Backend Dev" },
                                        { name: "Elena R.", role: "UX Designer" }
                                    ].map((user, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{user.name[0]}</div>
                                            <div>
                                                <div className="text-sm font-medium text-white">{user.name}</div>
                                                <div className="text-xs text-[#7BAF8E]">{user.role}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* AI Graph UI */
                                <div className="relative w-full h-full min-h-[250px] flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                                    {/* Connection Lines */}
                                    <svg className="absolute inset-0 h-full w-full [filter:drop-shadow(0_0_4px_rgba(62,224,127,0.4))]">
                                        <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="#3EE07F" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                                        <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="#3EE07F" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                                        <line x1="50%" y1="50%" x2="50%" y2="80%" stroke="#3EE07F" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                                    </svg>
                                    
                                    {/* Core Node */}
                                    <div className="absolute z-20 w-16 h-16 rounded-full bg-[#0F2027] border-2 border-[#3EE07F] flex items-center justify-center shadow-[0_0_30px_rgba(62,224,127,0.4)]">
                                        <div className="text-[#3EE07F] text-xs font-bold text-center leading-tight">Project<br/>Alpha</div>
                                    </div>
                                    
                                    {/* Satellite Nodes */}
                                    <div className="absolute top-[20%] left-[15%] z-10 flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">S.J</div>
                                        <span className="text-[10px] text-[#3EE07F] bg-[#3EE07F]/20 px-2 py-0.5 rounded-full">98% Match</span>
                                    </div>
                                    <div className="absolute top-[20%] right-[15%] z-10 flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">M.T</div>
                                        <span className="text-[10px] text-[#3EE07F] bg-[#3EE07F]/20 px-2 py-0.5 rounded-full">94% Match</span>
                                    </div>
                                    <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">E.R</div>
                                        <span className="text-[10px] text-[#3EE07F] bg-[#3EE07F]/20 px-2 py-0.5 rounded-full">99% Match</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CARD 2: Predictive Analytics */}
                    <div className="group col-span-1 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent border border-white/10 p-8 flex flex-col relative overflow-hidden transition-all duration-500 hover:border-white/30 min-h-[300px]">
                        <h3 className="text-xl font-bold text-white mb-2">Predictive Analytics</h3>
                        <p className="text-[#7BAF8E] text-xs leading-relaxed mb-6">Real-time AI analysis of historical data and team capacity to predict success probability.</p>
                        
                        <div className="flex-grow flex items-center justify-center">
                            <div className="relative w-36 h-36 flex items-center justify-center">
                                {/* Background Circle */}
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                    {/* Progress Circle - Animates on hover via stroke-dashoffset */}
                                    <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="402" strokeDashoffset="402" className="text-[#3EE07F] transition-all duration-1000 ease-out group-hover:[stroke-dashoffset:60]" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-white">85<span className="text-lg">%</span></span>
                                    <span className="text-[9px] uppercase tracking-widest text-[#7BAF8E] mt-1 group-hover:text-[#3EE07F] transition-colors">Success</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 3: Dynamic Task Routing */}
                    <div className="group col-span-1 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent border border-white/10 p-8 flex flex-col relative overflow-hidden transition-all duration-500 hover:border-white/30 min-h-[300px]">
                        <h3 className="text-xl font-bold text-white mb-2">Dynamic Routing</h3>
                        <p className="text-[#7BAF8E] text-xs leading-relaxed mb-6">Tasks are automatically distributed based on real-time workload and specific skill proficiencies.</p>
                        
                        <div className="flex-grow flex flex-col justify-center gap-4 relative z-10">
                            {/* Fake Task Card 1 */}
                            <div className="w-full bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between transform transition-transform duration-500 group-hover:translate-x-4">
                                <div className="flex gap-3 items-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                    <div className="h-2.5 w-16 bg-white/20 rounded-full"></div>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-white/10"></div>
                            </div>
                            {/* Fake Task Card 2 (Active/Routed) */}
                            <div className="w-full bg-[#3EE07F]/10 border border-[#3EE07F]/30 p-3 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(62,224,127,0.1)]">
                                <div className="flex gap-3 items-center">
                                    <div className="w-2 h-2 rounded-full bg-[#3EE07F] animate-pulse"></div>
                                    <div className="h-2.5 w-24 bg-white/40 rounded-full"></div>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-[#3EE07F] flex items-center justify-center"><svg className="w-3 h-3 text-[#0F2027]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 4: Instant Brief Parsing (Wide) */}
                    <div className="group col-span-1 md:col-span-2 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent border border-white/10 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden transition-all duration-500 hover:border-white/30 min-h-[300px]">
                        <div className="flex-1 z-10">
                            <h3 className="text-xl font-bold text-white mb-2">Instant Brief Parsing</h3>
                            <p className="text-[#7BAF8E] text-sm leading-relaxed">Upload your PDF or DOCX project briefs. The AI instantly extracts deliverables, timelines, and required skills to auto-generate your project structure.</p>
                        </div>
                        
                        <div className="w-full md:w-64 h-40 bg-black/40 rounded-xl border border-white/10 relative overflow-hidden shrink-0 flex items-center justify-center z-10 group-hover:border-[#3EE07F]/30 transition-colors">
                            <div className="w-20 h-24 bg-white/10 border border-white/20 rounded flex flex-col gap-2 p-3 relative">
                                <div className="w-full h-1 bg-white/30 rounded-full"></div>
                                <div className="w-3/4 h-1 bg-white/30 rounded-full"></div>
                                <div className="w-full h-1 bg-white/30 rounded-full"></div>
                                <div className="w-1/2 h-1 bg-[#3EE07F] rounded-full mt-auto"></div>
                                
                                {/* Animated Scan Line */}
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#3EE07F]/20 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1500 ease-in-out">
                                    <div className="w-full h-[2px] bg-[#3EE07F] shadow-[0_0_8px_#3EE07F] mt-10"></div>
                                </div>
                            </div>
                            
                            {/* Extracted Data Pills */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-300">
                                <span className="text-[9px] font-mono bg-[#3EE07F]/20 text-[#3EE07F] px-2 py-1 rounded border border-[#3EE07F]/30 translate-x-4 group-hover:translate-x-0 transition-transform duration-500">"React"</span>
                                <span className="text-[9px] font-mono bg-white/10 text-white px-2 py-1 rounded border border-white/20 translate-x-4 group-hover:translate-x-0 transition-transform duration-500 delay-100">"3 Weeks"</span>
                            </div>
                        </div>
                    </div>

                    {/* CARD 5: Skill Gap Detection */}
                    <div className="group col-span-1 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent border border-white/10 p-8 flex flex-col relative overflow-hidden transition-all duration-500 hover:border-white/30 min-h-[300px]">
                        <h3 className="text-xl font-bold text-white mb-2">Skill Gap Detection</h3>
                        <p className="text-[#7BAF8E] text-xs leading-relaxed mb-6">Compare team proficiencies against requirements and get targeted learning resources.</p>
                        
                        <div className="flex-grow flex flex-col justify-end gap-3 z-10">
                            <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                                <span className="text-sm font-medium text-white">Full-Stack Dev</span>
                                <span className="text-[10px] bg-[#3EE07F]/20 text-[#3EE07F] px-2 py-1 rounded-full">Covered</span>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center justify-between group-hover:border-red-500/60 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    <span className="text-sm font-medium text-white">AWS DevOps</span>
                                </div>
                                <span className="text-[10px] text-red-400 font-semibold cursor-pointer hover:text-white transition-colors">View Courses &rarr;</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default FeaturesPage;
