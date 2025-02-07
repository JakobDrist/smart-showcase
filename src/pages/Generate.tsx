
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Sparkles, RotateCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OutlineItem {
  id: number;
  title: string;
}

const Generate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Mock outline generation for now
    const mockOutline = [
      { id: 1, title: "Tesla: Driving the Future of Electric Vehicles" },
      { id: 2, title: "History and Founding of Tesla" },
      { id: 3, title: "Tesla's Innovative Electric Vehicle Technology" },
      { id: 4, title: "Tesla's Autopilot and Self-Driving Capabilities" },
      { id: 5, title: "Tesla's Supercharger Network and Battery Technology" },
      { id: 6, title: "Tesla's Expansion into Energy Generation and Storage" },
    ];

    await new Promise((resolve) => setTimeout(resolve, 1500));
    setOutline(mockOutline);
    setIsGenerating(false);
    
    toast({
      title: "Disposition genereret",
      description: "Du kan nu redigere dispositionen før den endelige generering.",
    });
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
          <h1 className="text-3xl font-bold text-center mb-8">Generer</h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <div className="relative">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="En præsentation om..."
                  className="w-full pl-4 pr-10 py-2 rounded-lg"
                />
                <RotateCw
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                  onClick={() => setPrompt("")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Antal slides</label>
              <Select defaultValue="8">
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Vælg antal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 slides</SelectItem>
                  <SelectItem value="6">6 slides</SelectItem>
                  <SelectItem value="8">8 slides</SelectItem>
                  <SelectItem value="10">10 slides</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sprog</label>
              <Select defaultValue="da">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Vælg sprog" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="da">Dansk</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {outline.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Disposition</h2>
              <div className="space-y-2 bg-white rounded-lg p-4">
                {outline.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-500">{item.id}</span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const newOutline = outline.map((o) =>
                          o.id === item.id ? { ...o, title: e.target.value } : o
                        );
                        setOutline(newOutline);
                      }}
                      className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!prompt || isGenerating}
              className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-6 rounded-full transition-all duration-300"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {isGenerating ? "Genererer..." : outline.length > 0 ? "Generer præsentation" : "Generer disposition"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generate;
