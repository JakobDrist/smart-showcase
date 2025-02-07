
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const Editor = () => {
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([
    {
      id: 1,
      title: "Velkommen til din præsentation",
      content: "Klik for at redigere",
    },
  ]);

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

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
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
        </div>
      </div>
    </div>
  );
};

export default Editor;
