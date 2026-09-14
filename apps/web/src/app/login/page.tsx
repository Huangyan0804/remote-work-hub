"use client";

import { useT } from "next-i18next/client";

export default function Login() {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="grid grid-cols-[40%_minmax(0,1fr)]">
        <div className="bg-primary"></div>

        <div></div>
      </div>
    </div>
  );
}
