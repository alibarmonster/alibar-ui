"use client";

import { useRef } from "react";
import { CreditCard, Rocket } from "lucide-react";
import { StatefulButton } from "@/components/ui/stateful-button/stateful-button";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function Default() {
  return (
    <StatefulButton onClick={() => wait(1400)} loadingLabel="Saving" successLabel="Saved">
      Save changes
    </StatefulButton>
  );
}

export function HandlesErrors() {
  const attempts = useRef(0);
  return (
    <StatefulButton
      variant="outline"
      onClick={async () => {
        attempts.current += 1;
        await wait(1200);
        if (attempts.current % 2 === 1) throw new Error("Deploy failed");
      }}
      loadingLabel="Deploying"
      successLabel="Deployed"
      errorLabel="Deploy failed"
    >
      <Rocket aria-hidden="true" />
      Deploy
    </StatefulButton>
  );
}

export function Checkout() {
  return (
    <StatefulButton
      variant="primary"
      size="lg"
      onClick={() => wait(1600)}
      loadingLabel="Processing payment"
      successLabel="Paid"
      resetAfter={2400}
    >
      <CreditCard aria-hidden="true" />
      Pay $49.00
    </StatefulButton>
  );
}
