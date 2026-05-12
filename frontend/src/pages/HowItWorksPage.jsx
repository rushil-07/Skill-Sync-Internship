import React from 'react';

const HowItWorksPage = () => {
    const steps = [
        {
            num: "01",
            title: "Upload & Extract",
            desc: "Create a new project and upload your project brief. The AI instantly parses the document to extract required skills, timelines, and deliverables.",
            visual: (
                <div className="relative w-full h-48 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-[#3EE07F]/30 transition-colors">
                    <div className="flex gap-6 items-center w-full px-8">
                        {/* Document */}
                        <div className="relative w-16 h-20 bg-white/5 border border-white/20 rounded shadow-lg flex flex-col items-center pt-4 gap-2">
                            <div className="w-8 h-1 bg-white/40 rounded"></div>
                            <div className="w-10 h-1 bg-white/40 rounded"></div>
                            <div className="w-6 h-1 bg-[#3EE07F] rounded"></div>
                            {/* Scanning Laser */}
                            <div className="absolute top-0 w-full h-px bg-[#3EE07F] shadow-[0_0_8px_#3EE07F] animate-[bounce_2s_infinite]"></div>
                        </div>
                        {/* Data Extraction Flow */}
                        <div className="flex-grow flex flex-col gap-2 relative">
                            <div className="h-px w-full bg-gradient-to-r from-[#3EE07F]/50 to-transparent border-dashed"></div>
                            <span className="absolute -top-3 left-1/2 text-[8px] text-[#3EE07F] uppercase tracking-widest bg-[#0F2027] px-2">Parsing</span>
                        </div>
                        {/* Resulting Data */}
                        <div className="flex flex-col gap-2">
                            <div className="px-3 py-1 bg-[#3EE07F]/10 border border-[#3EE07F]/30 rounded text-xs text-[#3EE07F] font-mono">"React"</div>
                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-white font-mono">"4 Weeks"</div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            num: "02",
            title: "Match & Assemble",
            desc: "The AI analyzes the requirements and scans your talent pool, outputting the top recommended team compositions with success probability scores.",
            visual: (
                <div className="relative w-full h-48 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-[#3EE07F]/30 transition-colors">
                    {/* Radar Sweep Background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <div className="w-32 h-32 rounded-full border border-[#3EE07F] animate-ping"></div>
                        <div className="absolute w-24 h-24 rounded-full border border-[#3EE07F]"></div>
                    </div>
                    {/* User Nodes locking in */}
                    <div className="relative z-10 flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500 text-xs">US</div>
                        <div className="w-12 h-12 rounded-full bg-[#1A4D2E] border-2 border-[#3EE07F] shadow-[0_0_15px_rgba(62,224,127,0.3)] flex items-center justify-center z-20 text-[#3EE07F] font-bold text-xs">TEAM</div>
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center -translate-y-4 group-hover:translate-y-0 transition-transform duration-500 text-xs">ER</div>
                    </div>
                </div>
            )
        },
        {
            num: "03",
            title: "Automate & Execute",
            desc: "Tasks are created and the AI suggests optimal assignees based on real-time capacity. Work flows smoothly with automatic notifications.",
            visual: (
                <div className="relative w-full h-48 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-[#3EE07F]/30 transition-colors">
                    {/* Mini Kanban Board */}
                    <div className="flex gap-4 w-full px-6">
                        <div className="flex-1 bg-white/5 rounded p-2 flex flex-col gap-2 border border-white/5">
                            <span className="text-[10px] text-white/50 uppercase">To Do</span>
                            <div className="w-full h-8 bg-white/10 rounded group-hover:opacity-0 transition-opacity duration-500 delay-100"></div>
                        </div>
                        <div className="flex-1 bg-white/5 rounded p-2 flex flex-col gap-2 border border-white/5 relative">
                            <span className="text-[10px] text-[#3EE07F] uppercase">Active</span>
                            {/* Moving Task */}
                            <div className="absolute top-7 left-2 right-2 h-8 bg-[#3EE07F]/20 border border-[#3EE07F]/50 rounded flex items-center px-2 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_10px_rgba(62,224,127,0.2)]">
                                <div className="w-4 h-4 rounded-full bg-[#3EE07F] flex items-center justify-center"><span className="text-[8px] text-[#0F2027]">✓</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            num: "04",
            title: "Monitor & Adapt",
            desc: "The system continuously monitors metrics. If success probability drops or members are overloaded, AI sends alerts and suggests interventions.",
            visual: (
                <div className="relative w-full h-48 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-[#3EE07F]/30 transition-colors">
                    {/* Chart and Alert */}
                    <div className="w-full px-8 relative flex flex-col gap-4">
                        <div className="flex items-end gap-2 h-16 border-b border-white/10 pb-2">
                            <div className="w-1/4 h-8 bg-white/20 rounded-t"></div>
                            <div className="w-1/4 h-12 bg-white/20 rounded-t"></div>
                            <div className="w-1/4 h-6 bg-red-500/40 rounded-t relative group-hover:bg-[#3EE07F]/40 transition-colors duration-700">
                                {/* Alert Popup */}
                                <div className="absolute -top-8 -left-4 bg-red-500 text-white text-[8px] px-2 py-1 rounded shadow-lg opacity-100 group-hover:opacity-0 transition-opacity duration-300">Overloaded</div>
                                <div className="absolute -top-8 -left-4 bg-[#3EE07F] text-[#0F2027] font-bold text-[8px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300">Rebalanced</div>
                            </div>
                            <div className="w-1/4 h-10 bg-white/20 rounded-t"></div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <section className="min-h-screen bg-[#0F2027] text-white py-32 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#3EE07F]/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-24 relative z-10">
                    <h2 className="text-sm font-bold tracking-widest text-[#3EE07F] uppercase mb-4">The System Flow</h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-[#F0FAF4] mb-6 leading-tight">
                        From Project Brief to <br/> Execution in Seconds.
                    </h3>
                    <p className="text-[#7BAF8E] text-lg">
                        Watch how SkillSync transforms a static document into an actively managed, perfectly staffed project ecosystem.
                    </p>
                </div>

                {/* Timeline Container */}
                <div className="relative max-w-5xl mx-auto">
                    
                    {/* Central Vertical Line (Desktop only) */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#3EE07F]/0 via-white/10 to-[#3EE07F]/0 -translate-x-1/2"></div>

                    <div className="flex flex-col gap-16 md:gap-32">
                        {steps.map((step, index) => (
                            <div key={index} className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-16 group ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                                
                                {/* Timeline Dot (Desktop only) */}
                                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0F2027] border-2 border-white/10 group-hover:border-[#3EE07F] items-center justify-center z-10 transition-colors duration-500 shadow-[0_0_0_4px_#0F2027]">
                                    <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-[#3EE07F] transition-colors duration-500"></div>
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 w-full text-left md:text-right flex flex-col justify-center">
                                    {/* Mobile Number Indicator */}
                                    <div className="md:hidden text-[#3EE07F] font-mono text-sm mb-2 font-bold">{step.num}</div>
                                    <div className={`flex flex-col ${index % 2 === 0 ? 'md:items-end md:text-right' : 'md:items-start md:text-left'}`}>
                                        <div className="hidden md:block text-[#3EE07F] font-mono text-sm mb-2 font-bold opacity-50 group-hover:opacity-100 transition-opacity">{step.num}</div>
                                        <h4 className="text-2xl font-bold text-white mb-3 group-hover:text-[#F0FAF4]">{step.title}</h4>
                                        <p className="text-[#7BAF8E] leading-relaxed max-w-md">{step.desc}</p>
                                    </div>
                                </div>

                                {/* Visual Content */}
                                <div className="flex-1 w-full relative z-10">
                                    {/* Glowing backdrop on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#3EE07F]/0 to-[#3EE07F]/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    {step.visual}
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default HowItWorksPage;