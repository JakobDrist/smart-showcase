
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { GenerationProgress } from "@/components/generate/GenerationProgress";
import { usePresentation } from "@/hooks/usePresentation";

const GenerationProgressPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    outline,
    setOutline,
    generationStep,
    generationProgress,
    slideContent,
    language,
    handleGeneratePresentation,
  } = usePresentation();

  useEffect(() => {
    // Get outline from URL parameters
    const outlineParam = searchParams.get("outline");
    const languageParam = searchParams.get("language");
    
    if (outlineParam) {
      try {
        const parsedOutline = JSON.parse(outlineParam);
        setOutline(parsedOutline);
        
        // Start generation automatically
        handleGeneratePresentation();
      } catch (error) {
        console.error("Error parsing outline:", error);
        navigate("/generate");
      }
    } else {
      navigate("/generate");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFE5EC] to-[#FFE5EC]/50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/generate")}
            className="text-gray-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbage
          </Button>
        </div>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Genererer præsentation
          </h1>

          <GenerationProgress
            step={generationStep}
            progress={generationProgress}
            slideContent={slideContent}
          />
        </div>
      </div>
    </div>
  );
};

export default GenerationProgressPage;
