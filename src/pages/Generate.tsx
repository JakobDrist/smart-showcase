
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { GenerationProgress } from "@/components/generate/GenerationProgress";
import { GenerationForm } from "@/components/generate/GenerationForm";
import { usePresentation } from "@/hooks/usePresentation";

const Generate = () => {
  const navigate = useNavigate();
  const {
    prompt,
    setPrompt,
    isGenerating,
    generationStep,
    generationProgress,
    outline,
    setOutline,
    slideContent,
    slideCount,
    setSlideCount,
    language,
    setLanguage,
    handleGenerateOutline,
    handleGeneratePresentation,
  } = usePresentation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFE5EC] to-[#FFE5EC]/50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbage
          </Button>
        </div>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Generer præsentation</h1>

          {isGenerating && (
            <GenerationProgress
              step={generationStep}
              progress={generationProgress}
              slideContent={slideContent}
            />
          )}

          <GenerationForm
            prompt={prompt}
            setPrompt={setPrompt}
            slideCount={slideCount}
            setSlideCount={setSlideCount}
            language={language}
            setLanguage={setLanguage}
            outline={outline}
            setOutline={setOutline}
            isGenerating={isGenerating}
            onGenerate={outline.length > 0 ? handleGeneratePresentation : handleGenerateOutline}
          />
        </div>
      </div>
    </div>
  );
};

export default Generate;
