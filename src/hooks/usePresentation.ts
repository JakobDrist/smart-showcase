
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OutlineItem {
  id: number;
  title: string;
}

interface StreamUpdate {
  type: 'content' | 'slide-complete' | 'complete' | 'error';
  slide?: number;
  content?: string;
  presentationId?: string;
  message?: string;
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

      if (error) {
        throw error;
      }

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
    setGenerationStep("Genererer præsentation...");
    setGenerationProgress(0);
    setSlideContent(new Array(outline.length).fill(''));

    try {
      const response = await supabase.functions.invoke('generate-slides', {
        body: { outline, language },
        headers: { 'Accept': 'text/event-stream' },
      });

      if (!response.data) throw new Error('No response data');

      const reader = new ReadableStreamDefaultReader(response.data as unknown as ReadableStream);
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            try {
              const update: StreamUpdate = JSON.parse(line.slice(5));
              
              switch (update.type) {
                case 'content':
                  if (typeof update.slide === 'number' && update.content) {
                    setSlideContent(prev => {
                      const newContent = [...prev];
                      newContent[update.slide!] = (newContent[update.slide!] || '') + update.content;
                      return newContent;
                    });
                    setGenerationProgress(
                      Math.min(100, ((update.slide! + 1) / outline.length) * 100)
                    );
                  }
                  break;
                
                case 'slide-complete':
                  if (typeof update.slide === 'number') {
                    setGenerationStep(`Slide ${update.slide + 1}/${outline.length} færdig`);
                  }
                  break;
                
                case 'complete':
                  if (update.presentationId) {
                    setGenerationProgress(100);
                    setGenerationStep("Præsentation færdig!");
                    toast({
                      title: "Præsentation genereret",
                      description: "Din præsentation er klar!",
                    });
                    navigate(`/editor/${update.presentationId}`);
                  }
                  break;
                
                case 'error':
                  throw new Error(update.message || 'Unknown error');
              }
            } catch (e) {
              console.error('Error parsing stream update:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating presentation:', error);
      toast({
        title: "Fejl",
        description: error.message || "Der opstod en fejl ved generering af præsentationen",
        variant: "destructive",
      });
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
