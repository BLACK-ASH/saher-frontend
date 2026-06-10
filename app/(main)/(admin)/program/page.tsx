import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddProgram from "@/features/program/add-program";

const page = () => {
  return (
    <section className="p-3 container mx-auto h-[calc(100vh-100px)]">
      <Tabs defaultValue="session" className="">
        <TabsList>
          <TabsTrigger value="session">Session</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
          <TabsTrigger value="program">Program</TabsTrigger>
        </TabsList>
        <TabsContent value="session">This is session tab</TabsContent>
        <TabsContent value="workshop">This is workshop tab</TabsContent>
        <TabsContent value="program">
          <AddProgram />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default page;
