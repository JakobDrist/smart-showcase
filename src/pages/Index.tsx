
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Wand2, Upload } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePresentation = async () => {
    setIsLoading(true);
    try {
      navigate("/generate");
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
    <div className="min-h-screen bg-gradient-to-b from-[#FFE5EC] to-[#FFE5EC]/50">
      <div className="container mx-auto px-4 py-16 animate-fade-in">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium inline-block">
            Powered by AI
          </span>
          
          <h1 className="text-5xl font-bold text-foreground mt-8 mb-4">
            Skab med AI
          </h1>
          
          <p className="text-xl text-muted-foreground mb-4">
            Hvordan vil du komme i gang?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Button
              variant="outline"
              size="lg"
              onClick={handleCreatePresentation}
              className="h-auto p-6 flex flex-col items-center gap-4 hover:bg-white/80"
            >
              <FileText className="h-8 w-8" />
              <div>
                <div className="font-semibold">Indsæt tekst</div>
                <div className="text-sm text-muted-foreground">
                  Opret fra noter eller eksisterende indhold
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleCreatePresentation}
              className="h-auto p-6 flex flex-col items-center gap-4 hover:bg-white/80 relative overflow-hidden"
            >
              <Wand2 className="h-8 w-8" />
              <div>
                <div className="font-semibold">Generer</div>
                <div className="text-sm text-muted-foreground">
                  Opret fra et enkelt prompt på få sekunder
                </div>
              </div>
              <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                Populær
              </span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleCreatePresentation}
              className="h-auto p-6 flex flex-col items-center gap-4 hover:bg-white/80"
            >
              <Upload className="h-8 w-8" />
              <div>
                <div className="font-semibold">Importer fil eller URL</div>
                <div className="text-sm text-muted-foreground">
                  Forbedre eksisterende dokumenter eller websider
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
