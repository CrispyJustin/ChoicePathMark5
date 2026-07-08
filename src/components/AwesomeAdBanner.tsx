import { useEffect, useRef } from "react";

export function AwesomeAdBanner() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Initialize SuperAwesome SDK here (provided by them upon signup)
    // 2. Load the ad into the adRef.current element
    console.log("SuperAwesome ad placement initiated");
  }, []);

  return (
    <div className="my-4 p-2 bg-muted/20 border-2 border-dashed rounded-xl text-center">
      <p className="text-xs text-muted-foreground mb-2">Advertisement</p>
      {/* SuperAwesome renders the ad into this div */}
      <div ref={adRef} className="min-h-[90px]" />
    </div>
  );
}
