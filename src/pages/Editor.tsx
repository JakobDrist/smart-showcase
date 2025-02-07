
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const Editor = () => {
  const { toast } = useToast();
  const { presentationId } = useParams();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPresentation = async () => {
      try {
        const { data: slideData, error: slidesError } = await supabase
          .from('slides')
          .select('*')
          .eq('presentation_id', presentationId)
          .order('position');

        if (slidesError) throw slidesError;

        if (slideData && slideData.length > 0) {
          setSlides(slideData);
        } else {
          toast({
            title: "Præsentation ikke fundet",
            description: "Vi kunne ikke finde den anmodede præsentation.",
            variant: "destructive",
          });
          navigate('/generate');
        }
      } catch (error) {
        console.error('Error loading presentation:', error);
        toast({
          title: "Fejl",
          description: "Der opstod en fejl ved indlæsning af præsentationen.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (presentationId) {
      loadPresentation();
    }
  }, [presentationId, navigate, toast]);

  const addSlide = async () => {
    const newPosition = slides.length;
    const { data: newSlide, error } = await supabase
      .from('slides')
      .insert({
        presentation_id: presentationId,
        position: newPosition,
        title: "Ny slide",
        content: "Klik for at redigere",
        theme: 'dark',
        layout: 'default',
        accent_color: '#4ade80',
        background_type: 'gradient',
        gradient: 'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved tilføjelse af ny slide.",
        variant: "destructive",
      });
      return;
    }

    setSlides([...slides, newSlide]);
    toast({
      title: "Slide tilføjet",
      description: "En ny slide er blevet tilføjet til din præsentation.",
    });
  };

  const updateSlide = async (slideId, updates) => {
    const { error } = await supabase
      .from('slides')
      .update(updates)
      .eq('id', slideId);

    if (error) {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved opdatering af slide.",
        variant: "destructive",
      });
      return;
    }

    setSlides(slides.map(slide => 
      slide.id === slideId ? { ...slide, ...updates } : slide
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <h2 className="text-2xl font-semibold text-center mb-4">Indlæser præsentation...</h2>
          <Progress value={100} className="animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <div className="flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm border-b">
        <Button
          variant="ghost"
          onClick={() => navigate('/generate')}
          className="text-muted-foreground"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Tilbage
        </Button>
        <Button onClick={addSlide} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Tilføj slide
        </Button>
      </div>

      <div className="flex-1 p-8">
        {slides.length > 0 && (
          <>
            <div 
              className="max-w-4xl mx-auto rounded-xl shadow-2xl overflow-hidden"
              style={{
                aspectRatio: '16/9',
                background: slides[currentSlide].background_type === 'gradient' 
                  ? slides[currentSlide].gradient 
                  : '#1a1a1a',
              }}
            >
              <div className="h-full w-full p-12">
                <div
                  contentEditable
                  className="text-6xl font-bold mb-8"
                  style={{ color: slides[currentSlide].accent_color }}
                  suppressContentEditableWarning
                  onBlur={(e) => updateSlide(slides[currentSlide].id, { 
                    title: e.target.textContent 
                  })}
                >
                  {slides[currentSlide].title}
                </div>
                <div
                  contentEditable
                  className="text-xl leading-relaxed"
                  suppressContentEditableWarning
                  onBlur={(e) => updateSlide(slides[currentSlide].id, { 
                    content: e.target.textContent 
                  })}
                >
                  {slides[currentSlide].content}
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8 gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="py-2 px-4 rounded-lg bg-gray-800">
                {currentSlide + 1} / {slides.length}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
                disabled={currentSlide === slides.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Editor;
