import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://yaocoding007.github.io/",
  author: "栗禄尧",
  desc: "个人博客",
  title: "栗栗在目",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerPage: 3,
};

export const LOCALE = ["en-EN"]; // set to [] to use the environment default

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/satnaing/astro-paper",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
];
