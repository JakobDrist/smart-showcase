
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus, Image, Palette } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SUPABASE_URL = "https://qrodseazvxvrixnmzumf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyb2RzZWF6dnh2cml4bm16dW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NDk3OTEsImV4cCI6MjA1NDUyNTc5MX0.ysXE_sLoCiYLdt__AcWV6RgrnSAEP6PHKEp-MB3rhwA";

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
        accent_color: '#9b87f5'
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

  const generateImage = async (prompt) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Failed to generate image');

      const data = await response.json();
      return data.image;
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved generering af billede.",
        variant: "destructive",
      });
      return null;
    }
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

  const currentTheme = slides[currentSlide]?.theme || 'dark';
  const currentAccentColor = slides[currentSlide]?.accent_color || '#9b87f5';

  return (
    <div className={`min-h-screen flex flex-col ${currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm border-b">
        <Button
          variant="ghost"
          onClick={() => navigate('/generate')}
          className="text-muted-foreground"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Tilbage
        </Button>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Palette className="mr-2 h-4 w-4" />
                Tema
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => updateSlide(slides[currentSlide].id, { theme: 'dark' })}>
                Mørkt tema
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSlide(slides[currentSlide].id, { theme: 'light' })}>
                Lyst tema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={addSlide} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Tilføj slide
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="w-64 bg-background/80 backdrop-blur-sm border-r p-4">
          <div className="space-y-2">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  currentSlide === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent hover:bg-accent/80"
                }`}
                style={{
                  borderLeft: `4px solid ${slide.accent_color || currentAccentColor}`
                }}
              >
                <h4 className="font-medium truncate">Slide {index + 1}</h4>
                <p className="text-sm opacity-70 truncate">{slide.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-8">
          {slides.length > 0 && (
            <>
              <div 
                className={`max-w-4xl mx-auto rounded-xl shadow-2xl overflow-hidden ${
                  currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
                style={{
                  aspectRatio: '16/9',
                  backgroundImage: slides[currentSlide].background_image ? 
                    `url(${slides[currentSlide].background_image})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="h-full w-full backdrop-blur-sm bg-background/40 p-12">
                  <div
                    contentEditable
                    className="text-5xl font-bold mb-8 focus:outline-none"
                    style={{ color: currentAccentColor }}
                    suppressContentEditableWarning
                    onBlur={(e) => updateSlide(slides[currentSlide].id, { 
                      title: e.target.textContent 
                    })}
                  >
                    {slides[currentSlide].title}
                  </div>
                  <div
                    contentEditable
                    className="text-xl leading-relaxed focus:outline-none"
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
                  onClick={() => navigateSlides("prev")}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className={`py-2 px-4 rounded-lg ${
                  currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}>
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
