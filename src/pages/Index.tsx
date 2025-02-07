
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePresentation = async () => {
    setIsLoading(true);
    try {
      // In the future, this will integrate with OpenAI
      toast({
        title: "Velkommen!",
        description: "Vi arbejder på at integrere AI-funktionalitet.",
      });
      // For now, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate("/editor");
    } catch (error) {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl. Prøv igen senere.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 py-16 animate-fade-in">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium inline-block">
            Powered by AI
          </span>
          
          <h1 className="text-5xl font-bold text-foreground mt-8 mb-4">
            Skab fantastiske præsentationer med AI
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Lad vores AI hjælpe dig med at skabe professionelle præsentationer på få minutter.
            Design, indhold og billeder genereres automatisk baseret på dine ønsker.
          </p>

          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              onClick={handleCreatePresentation}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-6 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              <Wand2 className="mr-2 h-5 w-5" />
              Start ny præsentation
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-accent">
              <h3 className="text-lg font-semibold mb-2">AI-Genereret Indhold</h3>
              <p className="text-muted-foreground">
                Vores AI skaber engagerende tekst og vælger passende billeder til din præsentation.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-accent">
              <h3 className="text-lg font-semibold mb-2">Professionelt Design</h3>
              <p className="text-muted-foreground">
                Automatisk layoutoptimering og designforslag baseret på dit indhold.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-accent">
              <h3 className="text-lg font-semibold mb-2">Hurtig Redigering</h3>
              <p className="text-muted-foreground">
                Intuitivt interface der gør det nemt at tilpasse din præsentation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
