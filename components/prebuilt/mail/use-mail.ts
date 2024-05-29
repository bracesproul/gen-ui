import { atom, useAtom } from "jotai";
import { type Mail } from "@/components/prebuilt/mail/mail";

export type MailConfig = {
  selected: Mail["id"] | null;
};

export function useMail({ mails }: { mails: Mail[] }) {
  const configAtom = atom<MailConfig>({
    selected: mails[0].id,
  });

  return useAtom(configAtom);
}
