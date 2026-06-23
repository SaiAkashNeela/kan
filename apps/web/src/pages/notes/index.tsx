import type { NextPageWithLayout } from "../_app";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import { NotesView } from "~/views/notes";

const NotesPage: NextPageWithLayout = () => {
  return (
    <>
      <NotesView />
      <Popup />
    </>
  );
};

NotesPage.getLayout = (page) => getDashboardLayout(page);

export default NotesPage;
