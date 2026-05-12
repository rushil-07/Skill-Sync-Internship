import React, { useState } from 'react';

const TeamsPage = () => {
    const [activeTab, setActiveTab] = useState(0);

    const roles = [
        {
            id: 'maker',
            title: "The Maker",
            subtitle: "Engineers, Designers & Creators",
            description: "SkillSync doesn't just assign you tasks; it actively protects your time and accelerates your career growth.",
            features: [
                {
                    name: "Flow State Guard",
                    desc: "AI detects high-focus tasks and automatically blocks your calendar from unnecessary meetings to prevent context-switching."
                },
                {
                    name: "Micro-Mentorship Matches",
                    desc: "Stuck on a problem? The AI scans the organization's skill graph and instantly connects you with an internal expert for a 15-minute unblocker."
                }
            ],
            visual: (
                <div className="w-full h-full flex flex-col justify-between p-6 animate-in fade-in zoom-in-95 duration-500">
                    {/* Flow State Visual */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Today's Schedule</span>
                            <span className="text-[10px] bg-[#3EE07F]/20 text-[#3EE07F] px-2 py-1 rounded-full border border-[#3EE07F]/30 animate-pulse">Flow Guard Active</span>
                        </div>
                        <div className="flex gap-2 h-10">
                            <div className="w-1/4 bg-white/10 rounded-lg flex items-center justify-center text-[10px] text-white/50">Sync</div>
                            <div className="w-1/2 bg-gradient-to-r from-[#1A4D2E] to-[#28623A] border border-[#3EE07F]/40 rounded-lg flex items-center justify-center text-xs font-bold text-[#3EE07F] shadow-[0_0_15px_rgba(62,224,127,0.15)]">Deep Work Block</div>
                            <div className="w-1/4 bg-white/10 rounded-lg flex items-center justify-center text-[10px] text-white/50">1:1</div>
                        </div>
                    </div>
                    {/* Mentorship Visual */}
                    <div className="bg-gradient-to-br from-[#3EE07F]/10 to-transparent border border-[#3EE07F]/20 rounded-2xl p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#3EE07F]/20 blur-2xl rounded-full"></div>
                        <h4 className="text-sm font-bold text-white mb-1">Stuck on AWS Lambda?</h4>
                        <p className="text-xs text-[#7BAF8E] mb-3">Sarah in Platform Ops is a 99% match for this issue.</p>
                        <button className="bg-white/10 hover:bg-white/20 transition-colors border border-white/20 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 w-max">
                            <span className="w-2 h-2 rounded-full bg-[#3EE07F]"></span>
                            Ping for Unblocker
                        </button>
                    </div>
                </div>
            )
        },
        {
            id: 'orchestrator',
            title: "The Orchestrator",
            subtitle: "Project Managers & Team Leads",
            description: "Move from reactive tracking to proactive steering. The AI acts as your dedicated chief of staff.",
            features: [
                {
                    name: "The 'What-If' Engine",
                    desc: "Simulate timeline impacts instantly. Ask 'What if the lead dev takes PTO?' and watch the AI dynamically recalculate the success probability."
                },
                {
                    name: "Auto-Drafted Stakeholder Briefs",
                    desc: "Stop spending Fridays writing updates. The AI synthesizes Jira tickets, code commits, and task statuses into a polished executive summary."
                }
            ],
            visual: (
                <div className="w-full h-full flex flex-col justify-between p-6 animate-in fade-in zoom-in-95 duration-500">
                    {/* What-If Engine Visual */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-white">Scenario Simulator</span>
                            <div className="w-8 h-4 bg-[#3EE07F]/30 rounded-full flex items-center px-0.5">
                                <div className="w-3 h-3 bg-[#3EE07F] rounded-full translate-x-4 shadow-[0_0_5px_#3EE07F]"></div>
                            </div>
                        </div>
                        <div className="space-y-2 relative">
                            {/* Original Timeline */}
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-[80%] bg-white/20 rounded-full"></div>
                            </div>
                            {/* Simulated Timeline */}
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-[95%] bg-amber-400/80 rounded-full relative">
                                    <div className="absolute right-0 top-0 h-full w-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.2)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.2)_75%,rgba(255,255,255,0.2)_100%)] bg-[length:10px_10px] animate-[shimmer_1s_linear_infinite]"></div>
                                </div>
                            </div>
                            <span className="text-[9px] text-amber-400 uppercase tracking-wider absolute right-0 -bottom-4">+3 Days Delay (Risk Detected)</span>
                        </div>
                    </div>
                    {/* Generative Text Visual */}
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-4 h-4 text-[#3EE07F] animate-spin-slow" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z"/></svg>
                            <span className="text-xs text-[#7BAF8E]">Generating Exec Summary...</span>
                        </div>
                        <div className="space-y-2">
                            <div className="h-2 w-3/4 bg-white/20 rounded animate-pulse"></div>
                            <div className="h-2 w-full bg-white/10 rounded animate-pulse delay-75"></div>
                            <div className="h-2 w-5/6 bg-white/10 rounded animate-pulse delay-150"></div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'visionary',
            title: "The Visionary",
            subtitle: "Directors & Operations",
            description: "Look beyond single projects. Understand the holistic health, capability, and velocity of your entire organization.",
            features: [
                {
                    name: "Burnout & Flight Risk AI",
                    desc: "Analyze capacity trends across the org to identify teams operating in the red, allowing you to hire proactively before burnout hits."
                },
                {
                    name: "Skill Velocity Metrics",
                    desc: "Track the direct ROI of your team's learning. See how closing skill gaps accelerates your average project delivery times."
                }
            ],
            visual: (
                <div className="w-full h-full flex flex-col justify-between p-6 animate-in fade-in zoom-in-95 duration-500">
                    {/* Burnout Heatmap Visual */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                        <span className="text-xs font-bold text-white block mb-3">Org Capacity Heatmap</span>
                        <div className="grid grid-cols-4 gap-2">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className={`h-8 rounded-md flex items-center justify-center text-[8px] font-bold text-black/50 ${i === 3 ? 'bg-red-500 animate-pulse' : i === 6 ? 'bg-amber-400' : 'bg-[#3EE07F]'}`}>
                                    {i === 3 ? '98%' : i === 6 ? '82%' : '45%'}
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Velocity Chart Visual */}
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 relative h-32 flex items-end">
                        <span className="absolute top-4 left-4 text-xs font-bold text-white">Skill Velocity ROI</span>
                        <svg className="w-full h-16 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                            {/* Gradient Fill */}
                            <path d="M0,100 L0,80 Q25,70 50,40 T100,10 L100,100 Z" fill="url(#velocityGradient)" opacity="0.2" />
                            {/* Trend Line */}
                            <path d="M0,80 Q25,70 50,40 T100,10" fill="none" stroke="#3EE07F" strokeWidth="3" className="animate-[dash_3s_ease-out_forwards]" strokeDasharray="200" strokeDashoffset="0" />
                            <defs>
                                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3EE07F" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>
            )
        }
    ];

    return (
        <section className="min-h-screen bg-[#0F2027] text-white py-32 px-6 md:px-12 lg:px-24">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-[#F0FAF4] mb-6">
                        An AI Co-Pilot for <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3EE07F] to-[#7BAF8E]">Every Persona.</span>
                    </h2>
                    <p className="text-[#7BAF8E] text-lg">
                        SkillSync isn't just a different view for different roles. It actively augments your workflow based on what you need to achieve.
                    </p>
                </div>

                {/* Main Interactive Interface */}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
                    
                    {/* Left Side: Navigation Tabs & Copy */}
                    <div className="w-full lg:w-5/12 flex flex-col gap-8">
                        
                        {/* Tab Switcher */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                            {roles.map((role, index) => (
                                <button
                                    key={role.id}
                                    onClick={() => setActiveTab(index)}
                                    className={`relative flex flex-col items-start px-6 py-4 rounded-xl text-left transition-all duration-300 w-full overflow-hidden ${activeTab === index ? 'bg-[#3EE07F]/10 border border-[#3EE07F]/30 shadow-[inset_0_0_20px_rgba(62,224,127,0.05)]' : 'hover:bg-white/5 border border-transparent'}`}
                                >
                                    {activeTab === index && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3EE07F] rounded-l-xl"></div>
                                    )}
                                    <span className={`font-bold text-lg mb-1 ${activeTab === index ? 'text-white' : 'text-white/60'}`}>{role.title}</span>
                                    <span className={`text-xs ${activeTab === index ? 'text-[#3EE07F]' : 'text-[#7BAF8E]'}`}>{role.subtitle}</span>
                                </button>
                            ))}
                        </div>

                        {/* Active Role Text Content */}
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left-4 duration-500" key={activeTab}>
                            <p className="text-lg text-white font-light leading-relaxed">
                                {roles[activeTab].description}
                            </p>
                            <div className="space-y-6">
                                {roles[activeTab].features.map((feat, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1 shrink-0">
                                            <div className="w-6 h-6 rounded-full bg-[#3EE07F]/20 flex items-center justify-center border border-[#3EE07F]/40">
                                                <div className="w-2 h-2 rounded-full bg-[#3EE07F]"></div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold mb-1">{feat.name}</h4>
                                            <p className="text-sm text-[#7BAF8E] leading-relaxed">{feat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Side: The Cinematic Dashboard Visual */}
                    <div className="w-full lg:w-7/12 relative h-[500px] lg:h-[600px] mt-8 lg:mt-0">
                        {/* Decorative Background Frame */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#1A4D2E]/20 to-[#0F2027] border border-white/10 rounded-[2rem] shadow-[0_20px_80px_rgba(0,0,0,0.5)] overflow-hidden">
                            
                            {/* macOS style traffic lights for SaaS feel */}
                            <div className="h-12 border-b border-white/10 bg-black/20 flex items-center px-6 gap-2">
                                <div className="w-3 h-3 rounded-full bg-white/20"></div>
                                <div className="w-3 h-3 rounded-full bg-white/20"></div>
                                <div className="w-3 h-3 rounded-full bg-white/20"></div>
                                <span className="ml-4 text-[10px] uppercase tracking-widest text-white/30 font-mono">SkillSync Workspace / {roles[activeTab].id}</span>
                            </div>

                            {/* The Dynamic Content Area */}
                            <div className="p-4 md:p-8 h-[calc(100%-3rem)] bg-[#0F2027]/80 backdrop-blur-sm relative overflow-hidden">
                                {/* Ambient Grid */}
                                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                                
                                {roles[activeTab].visual}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default TeamsPage;