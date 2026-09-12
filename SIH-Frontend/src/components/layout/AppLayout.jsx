import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumb } from './Breadcrumb';
import { RailGptWidget } from '../common/RailGptWidget';

export const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Breadcrumb />
          <main className="flex-1 p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      {/* Global Floating RAIL-GPT AI Assistant */}
      <RailGptWidget />
    </div>
  );
};
