import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { toSentenceCase } from "@/lib/text";
import { useMediaQuery } from "../hooks/useMediaQuery";
import MediaGrid from "./MediaGrid";
import UploadDialog from "./UploadDialog";
import type { MediaFileType } from "../types";

export default function MediaTab() {
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState<MediaFileType | undefined>();
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: media = [], isLoading } = useMediaQuery({ search, fileType });

  return (
    <div>
      <PageHeader
        title={toSentenceCase("Media & File")}
        subtitle={toSentenceCase("Gestisci i tuoi contenuti multimediali")}
        primaryCta={{
          label: toSentenceCase("Carica file"),
          onClick: () => setUploadOpen(true),
          icon: <Upload className="h-4 w-4" />,
        }}
      />

      <div className="container mx-auto px-6 max-w-7xl pb-6">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={toSentenceCase("cerca per nome o tag...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={fileType || "all"} onValueChange={(v) => setFileType(v === "all" ? undefined : v as MediaFileType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={toSentenceCase("tipo file")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{toSentenceCase("tutti")}</SelectItem>
              <SelectItem value="video">{toSentenceCase("video")}</SelectItem>
              <SelectItem value="image">{toSentenceCase("immagini")}</SelectItem>
              <SelectItem value="document">{toSentenceCase("documenti")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        ) : (
          <MediaGrid media={media} />
        )}
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
