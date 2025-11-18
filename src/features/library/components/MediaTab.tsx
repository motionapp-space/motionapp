import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Search } from "lucide-react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import MediaGrid from "./MediaGrid";
import UploadDialog from "./UploadDialog";
import type { MediaFileType } from "../types";

export default function MediaTab() {
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState<MediaFileType | undefined>();
  const [sortBy, setSortBy] = useState<"uploaded" | "name-asc" | "name-desc">("uploaded");
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: media = [], isLoading } = useMediaQuery({ search, fileType });

  const sortedAndFilteredMedia = useMemo(() => {
    let result = [...media];
    
    switch (sortBy) {
      case "uploaded":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "name-asc":
        result.sort((a, b) => a.filename.localeCompare(b.filename, 'it'));
        break;
      case "name-desc":
        result.sort((a, b) => b.filename.localeCompare(a.filename, 'it'));
        break;
    }
    
    return result;
  }, [media, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setFileType(undefined);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Control Bar */}
      <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca file..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filter Dropdown */}
        <Select value={fileType || "all"} onValueChange={(v) => setFileType(v === "all" ? undefined : v as MediaFileType)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Tipo file" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="image">Immagini</SelectItem>
            <SelectItem value="document">Documenti</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Ordina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uploaded">Ultimo caricato</SelectItem>
            <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Upload Button */}
        <Button 
          onClick={() => setUploadOpen(true)} 
          className="w-full md:w-auto gap-2"
        >
          <Upload className="h-4 w-4" />
          Carica File
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        </div>
      ) : (
        <MediaGrid 
          media={sortedAndFilteredMedia} 
          search={search}
          fileType={fileType}
          onClearFilters={clearFilters}
          onUploadClick={() => setUploadOpen(true)}
        />
      )}

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      {/* Sticky Mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50">
        <Button 
          onClick={() => setUploadOpen(true)} 
          className="w-full gap-2"
          size="lg"
        >
          <Upload className="h-5 w-5" />
          Carica File
        </Button>
      </div>
    </div>
  );
}
