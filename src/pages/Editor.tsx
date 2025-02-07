
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
        // Load slides for the presentation
        const { data: slideData, error: slidesError } = await supabase
          .from('slides')
          .select('*')
          .eq('presentation_id', presentationId)
          .order('position');

        if (slidesError) throw slidesError;

        if (slideData && slideData.length > 0) {
          setSlides(slideData.map(slide => ({
            id: slide.id,
            title: slide.title,
            content: slide.content,
          })));
        } else {
          // If no slides found, redirect to generate page
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

  const addSlide = () => {
    setSlides([
      ...slides,
      {
        id: slides.length + 1,
        title: "Ny slide",
        content: "Klik for at redigere",
      },
    ]);
    toast({
      title: "Slide tilføjet",
      description: "En ny slide er blevet tilføjet til din præsentation.",
    });
  };

  const navigateSlides = (direction: "prev" | "next") => {
    if (direction === "prev" && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    } else if (direction === "next" && currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
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
    <div className="min-h-screen bg-muted flex flex-col">
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <Button
          variant="ghost"
          onClick={() => navigate('/generate')}
          className="text-muted-foreground"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Tilbage
        </Button>
        <div className="flex gap-2">
          <Button onClick={addSlide} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Tilføj slide
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="w-64 bg-white border-r p-4">
          <div className="space-y-2">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  currentSlide === index
                    ? "bg-primary text-white"
                    : "bg-accent hover:bg-accent/80"
                }`}
              >
                <h4 className="font-medium truncate">Slide {index + 1}</h4>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-8">
          {slides.length > 0 && (
            <>
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg aspect-[16/9] p-8">
                <div
                  contentEditable
                  className="text-4xl font-bold mb-4 focus:outline-none"
                  suppressContentEditableWarning
                >
                  {slides[currentSlide].title}
                </div>
                <div
                  contentEditable
                  className="text-xl focus:outline-none"
                  suppressContentEditableWarning
                >
                  {slides[currentSlide].content}
                </div>
              </div>

              <div className="flex justify-center mt-8 gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigateSlides("prev")}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="py-2 px-4 bg-white rounded-lg">
                  {currentSlide + 1} / {slides.length}
                </span>
                <Button
                  variant="outline"
                  onClick={() => navigateSlides("next")}
                  disabled={currentSlide === slides.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
