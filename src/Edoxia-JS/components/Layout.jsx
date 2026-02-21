import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import BugReporter from './BugReporter';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
      <Footer />
      <BugReporter />
    </div>
  );
}
