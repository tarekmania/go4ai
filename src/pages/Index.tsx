import { useState } from 'react';
import { SchedulerLinkFinder } from '@/components/SchedulerLinkFinder';
import { Navigation } from '@/components/Navigation';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Scheduler Link Finder
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find Calendly and scheduler links for professionals across LinkedIn, Twitter, and the web
          </p>
        </div>
        <SchedulerLinkFinder />
      </main>
    </div>
  );
};

export default Index;