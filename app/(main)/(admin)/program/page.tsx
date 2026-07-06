import { SearchBox } from "@/components/search-box";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ParticipantView from "@/features/program/participant/all-participant";
import ParticipantHeader from "@/features/program/participant/participant-header";
import ProgramView from "@/features/program/program/all-programs";
import ProgramHeader from "@/features/program/program/program-header";
import AddSession from "@/features/program/session/add-session";
import SessionView from "@/features/program/session/all-sessions";
import AddWorkshop from "@/features/program/workshop/add-workshop";
import WorkshopView from "@/features/program/workshop/all-workshops";
import WorkshopHeader from "@/features/program/workshop/workshop-header";

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
        <TabsContent value="participant">
          <ParticipantHeader />
          <ParticipantView />
        </TabsContent>
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
          <WorkshopHeader />
          <WorkshopView />
        </TabsContent>
        <TabsContent value="program">
          <ProgramHeader />
          <ProgramView />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default page;
