import { useRouter } from "next/navigation";
import { t } from "@lingui/core/macro";
import { useEffect } from "react";
import { env } from "next-runtime-env";

import { authClient } from "@kan/auth/client";

import { PageHead } from "~/components/PageHead";
import SelectPlanView from "~/views/onboarding/select-plan";
import { getAppName } from "~/utils/branding";

export default function SelectPlanPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const appName = getAppName();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
    if (!isPending && env("NEXT_PUBLIC_KAN_ENV") !== "cloud") {
      router.push("/boards");
    }
  }, [session, isPending, router]);

  if (isPending || !session?.user) return null;

  return (
    <>
      <PageHead title={t`Select plan | ${appName}`} />
      <SelectPlanView />
    </>
  );
}
