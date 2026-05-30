'use client';

import { Bell, Search, User } from 'lucide-react';

export function Topbar() {

  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 shadow-sm z-10">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-500"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-slate-200 placeholder:text-slate-500 focus:ring-0 sm:text-sm"
            placeholder="Search leads, quotations, or products..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-300 relative">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-900"></span>
          </button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-800" aria-hidden="true" />

          <div className="flex items-center gap-x-3 cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-[0_0_10px_rgba(37,99,235,0.5)]">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden lg:flex lg:items-center">
              <span className="text-sm font-medium leading-6 text-slate-200" aria-hidden="true">
                System
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
