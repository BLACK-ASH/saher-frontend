import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddProgram from "@/features/program/add-program";
import ProgramView from "@/features/program/all-programs";

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
        <TabsContent value="session">This is session tab</TabsContent>
        <TabsContent value="workshop">This is workshop tab</TabsContent>
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
