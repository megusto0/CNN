import type { RouteObject } from "react-router-dom";
import Shell from "./components/layout/Shell";
import Overview from "./pages/Overview";
import Theory from "./pages/Theory";
import Assignment from "./pages/Assignment";
import Playground from "./pages/Playground";
import Transfer from "./pages/Transfer";
import Training from "./pages/Training";
import Compare from "./pages/Compare";
import Submit from "./pages/Submit";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Shell />,
    children: [
      { index: true, element: <Overview /> },
      { path: "theory", element: <Theory /> },
      { path: "theory/:topic", element: <Theory /> },
      { path: "assignment", element: <Assignment /> },
      { path: "variant", element: <Assignment /> },
      { path: "playground", element: <Playground /> },
      { path: "transfer", element: <Transfer /> },
      { path: "training", element: <Training /> },
      { path: "compare", element: <Compare /> },
      { path: "submit", element: <Submit /> },
    ],
  },
];
