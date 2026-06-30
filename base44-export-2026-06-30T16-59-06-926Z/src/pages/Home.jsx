import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PlayPage from "@/pages/Play";
import Settings from "@/pages/Settings";
import StatsPage from "@/pages/Stats";
import { Gamepad2, Settings2, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight text-white">
            Memory<span className="text-purple-500">Grid</span>
          </h1>
        </div>
      </header>

      <Tabs defaultValue="play" className="max-w-2xl mx-auto">
        <div className="sticky top-[57px] z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/40">
          <TabsList className="w-full bg-transparent rounded-none h-12 p-0 gap-0">
            <TabsTrigger
              value="play"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:text-purple-400 text-zinc-400 hover:text-zinc-200 transition-colors h-full gap-2"
            >
              <Gamepad2 className="w-4 h-4" />
              Play
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:text-purple-400 text-zinc-400 hover:text-zinc-200 transition-colors h-full gap-2"
            >
              <Settings2 className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:text-purple-400 text-zinc-400 hover:text-zinc-200 transition-colors h-full gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Stats
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="play" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
          <PlayPage />
        </TabsContent>
        <TabsContent value="settings" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
          <Settings />
        </TabsContent>
        <TabsContent value="stats" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
          <StatsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}