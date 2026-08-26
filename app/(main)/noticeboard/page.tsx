import { NoticeFeed } from "@/features/noticeboard/notice-feed";
import { NoticeTrash } from "@/features/noticeboard/notice-trash";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NoticeboardPage() {
  return (
    <Tabs defaultValue="active" className="p-4">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="trash">Trash</TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <NoticeFeed />
      </TabsContent>
      <TabsContent value="trash">
        <NoticeTrash />
      </TabsContent>
    </Tabs>
  );
}
