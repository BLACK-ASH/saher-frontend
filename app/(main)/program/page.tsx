import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ParticipantView from "@/features/program/participant/all-participant";
import ParticipantHeader from "@/features/program/participant/participant-header";
import ProgramView from "@/features/program/program/all-programs";
import ProgramHeader from "@/features/program/program/program-header";
import SessionView from "@/features/program/session/all-sessions";
import SessionHeader from "@/features/program/session/session-header";
import WorkshopView from "@/features/program/workshop/all-workshops";
import WorkshopHeader from "@/features/program/workshop/workshop-header";
import { Suspense } from "react";

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
        <Suspense>
          <TabsContent value="participant">
            <ParticipantHeader />
            <ParticipantView />
          </TabsContent>
          <TabsContent value="session">
            <SessionHeader />
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
        </Suspense>
      </Tabs>
    </section>
  );
};

export default page;
