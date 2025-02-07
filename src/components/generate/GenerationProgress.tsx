
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

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
        {slideContent.map((content, index) => (
          <div 
            key={index} 
            className={`transition-all duration-300 ${content ? 'opacity-100' : 'opacity-0'}`}
          >
            {content && (
              <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">Slide {index + 1}</h3>
                  <span className="text-xs text-gray-500">
                    {content ? 'Genereret' : 'Venter...'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
