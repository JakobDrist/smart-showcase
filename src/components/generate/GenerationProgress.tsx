
import { Progress } from "@/components/ui/progress";

interface GenerationProgressProps {
  step: string;
  progress: number;
  slideContent: string[];
}

export const GenerationProgress = ({ step, progress, slideContent }: GenerationProgressProps) => {
  return (
    <div className="mb-8 text-center">
      <h2 className="text-xl font-semibold mb-4">{step}</h2>
      <Progress value={progress} className="mb-2" />
      <p className="text-sm text-gray-600">{Math.round(progress)}% færdig</p>
      
      {slideContent.map((content, index) => (
        content && (
          <div key={index} className="mt-4 p-4 bg-white/50 rounded-lg">
            <h3 className="font-semibold mb-2">Slide {index + 1}</h3>
            <p className="text-sm text-gray-700">{content}</p>
          </div>
        )
      ))}
    </div>
  );
};
