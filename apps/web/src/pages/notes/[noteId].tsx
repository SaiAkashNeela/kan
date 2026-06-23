import type { NextPageWithLayout } from "../_app";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import { NoteView } from "~/views/notes";

const NotePage: NextPageWithLayout = () => {
  return (
    <>
      <NoteView />
      <Popup />
    </>
  );
};

NotePage.getLayout = (page) => getDashboardLayout(page);

export default NotePage;
