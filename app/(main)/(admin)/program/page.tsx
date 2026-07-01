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
              <Input className="w-1/2" />
            </div>
            <AddSession />
          </div>
          <SessionView />
        </TabsContent>
        <TabsContent value="workshop">
          <div className="flex my-4">
            <div className="flex-1">
              <Input className="w-1/2" />
            </div>
            <AddWorkshop />
          </div>
          <WorkshopView />
        </TabsContent>
        <TabsContent value="program">
          <div className="flex my-4">
            <div className="flex-1">
              <Input className="w-1/2" />
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
