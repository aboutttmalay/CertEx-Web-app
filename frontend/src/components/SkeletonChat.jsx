import React from 'react';

const SkeletonChat = () => {
  return (
    <div className="flex-1 p-6 space-y-8 overflow-hidden animate-in fade-in duration-500">
      
      {/* 1. Simulate User Message (Right) */}
      <div className="flex justify-end">
        <div className="bg-slate-200 h-12 w-1/3 rounded-2xl rounded-tr-none animate-pulse"></div>
      </div>

      {/* 2. Simulate AI Response (Left) - Text Block */}
      <div className="flex justify-start w-full">
        <div className="w-full max-w-4xl space-y-3">
          {/* Avatar & Name Skeleton */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse"></div>
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
          </div>
          {/* Text Lines */}
          <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm w-full space-y-2">
            <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 3. Simulate AI Data Table (Left) - The "Building Database" visual */}
      <div className="flex justify-start w-full">
        <div className="w-full max-w-4xl bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm space-y-4">
          <div className="h-4 w-40 bg-slate-200 rounded animate-pulse mb-4"></div>
          
          {/* Table Header */}
          <div className="flex gap-4 border-b border-slate-100 pb-2">
            <div className="h-4 w-1/4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-1/4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-1/4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-1/4 bg-slate-200 rounded animate-pulse"></div>
          </div>

          {/* Table Rows */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 pt-2">
              <div className="h-3 w-1/4 bg-slate-100 rounded animate-pulse"></div>
              <div className="h-3 w-1/4 bg-slate-100 rounded animate-pulse"></div>
              <div className="h-3 w-1/4 bg-slate-100 rounded animate-pulse"></div>
              <div className="h-3 w-1/4 bg-slate-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};

export default SkeletonChat;