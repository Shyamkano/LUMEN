'use client';

import React, { useState, useEffect, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Zap, Activity, ShieldCheck, PenTool } from "lucide-react";

// Types
interface TourStep {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  selector: string;
  side: "top" | "bottom" | "left" | "right";
}

const TOUR_CONFIG: Record<string, TourStep[]> = {
  '/feed': [
    {
      id: 'feed-1',
      title: 'Home Feed',
      content: 'This is where you discover the latest stories and posts from the community.',
      icon: <Sparkles className="text-orange-500" />,
      selector: '#feed-header',
      side: 'bottom'
    },
    {
      id: 'feed-2',
      title: 'Post Filters',
      content: 'Switch between Blogs, Code, and Micro-posts to see exactly what you’re looking for.',
      icon: <Zap className="text-yellow-500" />,
      selector: '#feed-filters',
      side: 'bottom'
    },
    {
      id: 'feed-3',
      title: 'Intelligence Map',
      content: 'Explore trending topics and see where the community is focusing right now.',
      icon: <Activity className="text-emerald-500" />,
      selector: '#intelligence-card',
      side: 'left'
    },
  ],
  '/new': [
    {
      id: 'editor-1',
      title: 'Writing Workspace',
      content: 'Craft your story here. It’s a minimalist, distraction-free space for your thoughts.',
      icon: <PenTool className="text-blue-500" />,
      selector: '#editor-main',
      side: 'bottom'
    },
    {
      id: 'editor-2',
      title: 'Ready to Publish?',
      content: 'Once you’re finished, use this button to share your story with the world.',
      icon: <ShieldCheck className="text-emerald-500" />,
      selector: '#publish-button',
      side: 'bottom'
    },
  ],
  '/post': [
    {
      id: 'post-1',
      title: 'Certified Story',
      content: 'This post is verified by the community. You can see the author details right below the title.',
      icon: <ShieldCheck className="text-emerald-500" />,
      selector: '#post-title',
      side: 'bottom'
    },
    {
      id: 'post-2',
      title: 'Story History',
      content: 'See how this story has evolved over time by checking the lineage and change logs here.',
      icon: <Activity className="text-blue-500" />,
      selector: '#narrative-history',
      side: 'top'
    },
  ],
};

export function OnbordaProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentSteps, setCurrentSteps] = useState<TourStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let routeSteps: TourStep[] = [];
    if (pathname === '/feed') routeSteps = TOUR_CONFIG['/feed'];
    else if (pathname === '/new') routeSteps = TOUR_CONFIG['/new'];
    else if (pathname.startsWith('/post/')) routeSteps = TOUR_CONFIG['/post'];

    if (routeSteps.length > 0) {
      // Group tours so they only show once per category
      const tourGroup = pathname.startsWith('/post/') ? 'post-view' : pathname.replace(/\//g, '-');
      const tourId = `lumen-tour-v7-${tourGroup}`;
      const hasSeen = localStorage.getItem(tourId);
      const isPermanentlyDisabled = localStorage.getItem('lumen-tours-disabled');
      
      if (!hasSeen && !isPermanentlyDisabled) {
        setCurrentSteps(routeSteps);
        setStepIndex(0);
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      } else {
        setIsVisible(false);
      }
    } else {
      setIsVisible(false);
    }
  }, [pathname]);

  const handleNext = () => {
    if (stepIndex < currentSteps.length - 1) {
      setStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex(prev => prev - 1);
  };

  const handleFinish = () => {
    const tourGroup = pathname.startsWith('/post/') ? 'post-view' : pathname.replace(/\//g, '-');
    const tourId = `lumen-tour-v7-${tourGroup}`;
    localStorage.setItem(tourId, 'true');
    setIsVisible(false);
  };

  const handleDismissAll = () => {
    localStorage.setItem('lumen-tours-disabled', 'true');
    setIsVisible(false);
  };

  if (!currentSteps.length || !isVisible) return <>{children}</>;

  const currentStep = currentSteps[stepIndex];

  return (
    <>
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <div className="fixed inset-0 z-[1000] pointer-events-none">
            {/* Backdrop Spotlight Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
              onClick={handleFinish}
            />

            {/* Elastic Card */}
            <motion.div
              layoutId="tour-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-10 right-10 w-full max-w-sm pointer-events-auto px-4 sm:px-0"
            >
              <div className="bg-[#0c0c0e] text-white rounded-[2.5rem] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.8)] border border-white/10 relative overflow-hidden">
                {/* Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-[60px]" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center text-2xl shadow-xl">
                      {currentStep.icon}
                    </div>
                    <button onClick={handleFinish} className="text-white/20 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                      Step {stepIndex + 1} of {currentSteps.length}
                    </span>
                    <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">{currentStep.title}</h3>
                    <p className="text-sm font-medium leading-relaxed opacity-70">
                      {currentStep.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4">
                      {stepIndex > 0 ? (
                        <button 
                          onClick={handlePrev}
                          className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                        >
                          Back
                        </button>
                      ) : (
                        <button 
                          onClick={handleDismissAll}
                          className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors italic"
                        >
                          Never show again
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={handleNext}
                      className="bg-white text-black rounded-full px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                    >
                      {stepIndex === currentSteps.length - 1 ? "Finish Tour" : "Next Step"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
