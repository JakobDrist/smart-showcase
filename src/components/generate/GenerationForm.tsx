
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GenerationFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  slideCount: string;
  setSlideCount: (count: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  outline: Array<{ id: number; title: string }>;
  setOutline: (outline: Array<{ id: number; title: string }>) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

export const GenerationForm = ({
  prompt,
  setPrompt,
  slideCount,
  setSlideCount,
  language,
  setLanguage,
  outline,
  setOutline,
  isGenerating,
  onGenerate,
}: GenerationFormProps) => {
  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <div className="relative">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="En præsentation om..."
              className="w-full pl-4 pr-10 py-2 rounded-lg"
              disabled={isGenerating}
            />
            <RotateCw
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
              onClick={() => !isGenerating && setPrompt("")}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Antal slides</label>
          <Select 
            value={slideCount} 
            onValueChange={setSlideCount}
            disabled={isGenerating}
          >
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
          <Select 
            value={language} 
            onValueChange={setLanguage}
            disabled={isGenerating}
          >
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
                  disabled={isGenerating}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={onGenerate}
          disabled={!prompt || isGenerating}
          className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-6 rounded-full transition-all duration-300"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          {isGenerating ? "Genererer..." : outline.length > 0 ? "Generer præsentation" : "Generer disposition"}
        </Button>
      </div>
    </>
  );
};
