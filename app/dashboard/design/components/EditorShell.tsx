"use client";

export default function EditorShell({
  sidebar,
  topbar,
  canvas,
  toolbar,
}: {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  canvas: React.ReactNode;
  toolbar: React.ReactNode;
}) {
  return (
    <div className="h-screen flex bg-[#efefe9] overflow-hidden">
      {sidebar}

      <div className="flex-1 flex flex-col">
        {topbar}
        {canvas}
      </div>
      {toolbar}
    </div>
  );
}