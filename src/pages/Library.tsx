import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import TemplatesTab from "@/features/library/components/TemplatesTab";
import MediaTab from "@/features/library/components/MediaTab";

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "templates";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="border-b bg-background sticky top-0 z-10">
          <div className="container mx-auto px-6 max-w-7xl">
            <TabsList className="h-14 bg-transparent border-0 p-0">
              <TabsTrigger 
                value="templates"
                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Template
              </TabsTrigger>
              <TabsTrigger 
                value="media"
                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Media & File
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="templates" className="mt-0">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          <MediaTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
