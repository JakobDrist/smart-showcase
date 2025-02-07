
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { GenerationForm } from "@/components/generate/GenerationForm";
import { usePresentation } from "@/hooks/usePresentation";

const Generate = () => {
  const navigate = useNavigate();
  const {
    prompt,
    setPrompt,
    isGenerating,
    outline,
    setOutline,
    slideCount,
    setSlideCount,
    language,
    setLanguage,
    handleGenerateOutline,
  } = usePresentation();

  const handleGenerateClick = async () => {
    if (outline.length > 0) {
      // Navigate to progress page with outline data
      const params = new URLSearchParams({
        outline: JSON.stringify(outline),
        language,
      });
      navigate(`/generation-progress?${params.toString()}`);
    } else {
      await handleGenerateOutline();
    }
  };

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
          <h1 className="text-3xl font-bold text-center mb-8">
            Generer præsentation
          </h1>

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
            onGenerate={handleGenerateClick}
          />
        </div>
      </div>
    </div>
  );
};

export default Generate;
