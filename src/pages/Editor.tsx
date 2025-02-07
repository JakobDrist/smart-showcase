
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Layout, 
  Grid, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  LayoutGrid,
  LayoutList,
  Timer,
  Box
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        layout_type: 'default',
        accent_color: '#4ade80',
        background_type: 'gradient',
        gradient: 'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
        text_align: 'left',
        spacing: 'normal'
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

  const navigateSlides = (direction: "prev" | "next") => {
    if (direction === "prev" && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    } else if (direction === "next" && currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const getTextAlignment = (align) => {
    switch (align) {
      case 'left':
        return 'text-left';
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  const getSpacing = (spacing) => {
    switch (spacing) {
      case 'compact':
        return 'space-y-2';
      case 'normal':
        return 'space-y-4';
      case 'relaxed':
        return 'space-y-8';
      default:
        return 'space-y-4';
    }
  };

  const renderContent = (content, layoutType) => {
    const contentLines = content.split('\n').filter(line => line.trim());
    
    switch (layoutType) {
      case 'boxes':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {contentLines.map((line, index) => (
              <div key={index} className="p-4 rounded-lg bg-black/20 backdrop-blur-sm">
                {line}
              </div>
            ))}
          </div>
        );
      
      case 'timeline':
        return (
          <div className="space-y-4">
            {contentLines.map((line, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="flex-1 pt-2">{line}</div>
              </div>
            ))}
          </div>
        );
      
      case 'grid':
        return (
          <div className="grid grid-cols-2 gap-6">
            {contentLines.map((line, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <div className={getSpacing(slides[currentSlide]?.spacing)}>
            {contentLines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        );
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
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Layout className="mr-2 h-4 w-4" />
                Layout
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => updateSlide(slides[currentSlide].id, { text_align: 'left' })}>
                <AlignLeft className="mr-2 h-4 w-4" />
                Venstrejusteret
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSlide(slides[currentSlide].id, { text_align: 'center' })}>
                <AlignCenter className="mr-2 h-4 w-4" />
                Centreret
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSlide(slides[currentSlide].id, { text_align: 'right' })}>
                <AlignRight className="mr-2 h-4 w-4" />
                Højrejusteret
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Visning
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => updateSlide(slides[currentSlide].id, { layout_type: 'default' })}>
                <LayoutList className="mr-2 h-4 w-4" />
                Standard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSlide(slides[currentSlide].id, { layout_type: 'boxes' })}>
                <Box className="mr-2 h-4 w-4" />
                Bokse
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSlide(slides[currentSlide].id, { layout_type: 'timeline' })}>
                <Timer className="mr-2 h-4 w-4" />
                Tidslinje
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSlide(slides[currentSlide].id, { layout_type: 'grid' })}>
                <Grid className="mr-2 h-4 w-4" />
                Grid
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Grid className="mr-2 h-4 w-4" />
                Mellemrum
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => updateSlide(slides[currentSlide].id, { spacing: 'compact' })}>
                Kompakt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSlide(slides[currentSlide].id, { spacing: 'normal' })}>
                Normal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSlide(slides[currentSlide].id, { spacing: 'relaxed' })}>
                Afslappet
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
                  borderLeft: `4px solid ${slide.accent_color || '#4ade80'}`
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
                className={`max-w-4xl mx-auto rounded-xl shadow-2xl overflow-hidden transition-all duration-300`}
                style={{
                  aspectRatio: '16/9',
                  background: slides[currentSlide].background_type === 'gradient' 
                    ? slides[currentSlide].gradient 
                    : slides[currentSlide].background_image 
                      ? `url(${slides[currentSlide].background_image})` 
                      : '#1a1a1a',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="h-full w-full backdrop-blur-sm bg-background/40 p-12">
                  <div
                    contentEditable
                    className={`text-6xl font-bold mb-8 focus:outline-none transition-all duration-300 ${
                      getTextAlignment(slides[currentSlide].text_align)
                    }`}
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
                    className={`text-xl leading-relaxed focus:outline-none ${
                      getTextAlignment(slides[currentSlide].text_align)
                    }`}
                    suppressContentEditableWarning
                    onBlur={(e) => updateSlide(slides[currentSlide].id, { 
                      content: e.target.textContent 
                    })}
                  >
                    {renderContent(slides[currentSlide].content, slides[currentSlide].layout_type)}
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
                <span className="py-2 px-4 rounded-lg bg-gray-800">
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
