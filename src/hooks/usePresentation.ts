
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OutlineItem {
  id: number;
  title: string;
}

export const usePresentation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [slideContent, setSlideContent] = useState<string[]>([]);
  const [slideCount, setSlideCount] = useState("8");
  const [language, setLanguage] = useState("da");

  const handleGenerateOutline = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    setGenerationStep("Genererer disposition...");
    setGenerationProgress(25);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-outline', {
        body: {
          prompt,
          slideCount: parseInt(slideCount),
          language,
        },
      });

      if (error) throw error;

      setOutline(data.outline);
      setGenerationProgress(50);
      toast({
        title: "Disposition genereret",
        description: "Du kan nu redigere dispositionen før den endelige generering.",
      });
    } catch (error) {
      console.error('Error generating outline:', error);
      toast({
        title: "Fejl",
        description: error.message || "Der opstod en fejl ved generering af disposition",
        variant: "destructive",
      });
      setGenerationProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePresentation = async () => {
    if (outline.length === 0) return;

    setIsGenerating(true);
    setGenerationStep("Forbereder præsentation...");
    setGenerationProgress(0);
    setSlideContent(new Array(outline.length).fill(''));

    try {
      // Opret først præsentationen
      const { data: presentation, error: presentationError } = await supabase
        .from('presentations')
        .insert({ title: outline[0].title })
        .select()
        .single();

      if (presentationError) throw presentationError;

      // Generer og indsæt slides
      for (let i = 0; i < outline.length; i++) {
        setGenerationStep(`Genererer slide ${i + 1} af ${outline.length}`);
        setGenerationProgress((i / outline.length) * 100);

        const { error: slideError } = await supabase
          .from('slides')
          .insert({
            presentation_id: presentation.id,
            position: i,
            title: outline[i].title,
            content: "Genererer indhold...",
            theme: 'dark',
            layout: 'default',
            accent_color: '#4ade80',
            background_type: 'gradient',
            gradient: 'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
          });

        if (slideError) throw slideError;

        // Generer indhold via Edge Function (dette kan ikke undgås da det kræver OpenAI)
        const response = await supabase.functions.invoke('generate-slides', {
          body: { slide: outline[i], language },
        });

        if (response.error) throw response.error;

        // Opdater slide med genereret indhold
        const { error: updateError } = await supabase
          .from('slides')
          .update({ content: response.data.content })
          .eq('presentation_id', presentation.id)
          .eq('position', i);

        if (updateError) throw updateError;
      }

      setGenerationProgress(100);
      setGenerationStep("Præsentation er færdig!");
      toast({
        title: "Præsentation genereret",
        description: "Din præsentation er klar!",
      });
      navigate(`/editor/${presentation.id}`);
    } catch (error) {
      console.error('Error generating presentation:', error);
      toast({
        title: "Fejl",
        description: error.message || "Der opstod en fejl ved generering af præsentationen",
        variant: "destructive",
      });
      setGenerationProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
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
  };
};
