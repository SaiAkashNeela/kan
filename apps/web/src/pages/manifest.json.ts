import type { GetServerSideProps } from "next";

import { getAppName } from "~/utils/branding";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const appName = getAppName();

  res.setHeader("Content-Type", "application/manifest+json");
  res.write(
    JSON.stringify({
      background_color: "#000000",
      categories: ["business", "productivity", "utilities"],
      description: `The open source project management alternative to Trello.`,
      display: "standalone",
      icons: [
        {
          sizes: "512x512",
          src: "/icon-512.png",
          type: "image/png",
          purpose: "any",
        },
      ],
      id: "/",
      screenshots: [
        {
          sizes: "1624x1561",
          src: "/screenshot-wide.png",
          type: "image/png",
          form_factor: "wide",
        },
        {
          sizes: "1290x2796",
          src: "/screenshot-narrow.png",
          type: "image/png",
          form_factor: "narrow",
        },
      ],
      orientation: "portrait-primary",
      name: `${appName} | The open source project management alternative to Trello`,
      scope: "/",
      short_name: appName,
      start_url: "/",
      theme_color: "#000000",
    }),
  );
  res.end();

  return {
    props: {},
  };
};

export default function ManifestRoute() {
  return null;
}
