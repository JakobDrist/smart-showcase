
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GenerationProgressProps {
  step: string;
  progress: number;
  slideContent: string[];
}

export const GenerationProgress = ({ step, progress, slideContent }: GenerationProgressProps) => {
  return (
    <div className="mb-8 text-center">
      <h2 className="text-xl font-semibold mb-4 flex items-center justify-center gap-2">
        {step}
        {progress < 100 && <Loader2 className="w-4 h-4 animate-spin" />}
      </h2>
      <Progress value={progress} className="mb-2" />
      <p className="text-sm text-gray-600">{Math.round(progress)}% færdig</p>
      
      <div className="mt-6 space-y-4">
        <AnimatePresence>
          {slideContent.map((content, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={content ? { opacity: 1, y: 0 } : {}}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {content ? (
                <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">Slide {index + 1}</h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Genereret
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-400">Slide {index + 1}</h3>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Venter...
                    </span>
                  </div>
                  <div className="h-8 bg-gray-100/50 rounded animate-pulse" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
