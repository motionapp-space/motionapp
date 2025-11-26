import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { FileText, FolderOpen } from "lucide-react";
import { useTopbar } from "@/contexts/TopbarContext";
import TemplatesTab from "@/features/library/components/TemplatesTab";
import MediaTab from "@/features/library/components/MediaTab";

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "templates";

  useTopbar({ title: "Libreria" });

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Template
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Media & File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="media">
          <MediaTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
