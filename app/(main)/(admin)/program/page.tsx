import { SearchBox } from "@/components/search-box";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddProgram from "@/features/program/add-program";
import AddSession from "@/features/program/add-session";
import AddWorkshop from "@/features/program/add-workshop";
import ProgramView from "@/features/program/all-programs";
import SessionView from "@/features/program/all-sessions";
import WorkshopView from "@/features/program/all-workshops";

const page = () => {
  return (
    <section className="p-3 container mx-auto h-[calc(100vh-100px)]">
      <Tabs defaultValue="program" className="">
        <TabsList>
          <TabsTrigger value="participant">Participant</TabsTrigger>
          <TabsTrigger value="program">Program</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
        </TabsList>
        <TabsContent value="participant">This is Participant tab</TabsContent>
        <TabsContent value="session">
          <div className="flex my-4">
            <div className="flex-1">
              <SearchBox
                queryName="keyword"
                placeholder="Search Session ..."
                debounce={700}
              />
            </div>
            <AddSession />
          </div>
          <SessionView />
        </TabsContent>
        <TabsContent value="workshop">
          <div className="flex my-4">
            <div className="flex-1">
              <SearchBox
                queryName="keyword"
                placeholder="Search Workshops ..."
                debounce={700}
              />
            </div>
            <AddWorkshop />
          </div>
          <WorkshopView />
        </TabsContent>
        <TabsContent value="program">
          <div className="flex my-4">
            <div className="flex-1">
              <SearchBox
                queryName="keyword"
                placeholder="Search Programs ..."
                debounce={700}
              />
            </div>
            <AddProgram />
          </div>
          <ProgramView />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default page;
