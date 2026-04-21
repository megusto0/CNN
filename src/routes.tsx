import type { RouteObject } from "react-router-dom";
import Shell from "./components/layout/Shell";
import Assignment from "./pages/Assignment";
import Compare from "./pages/Compare";
import Glossary from "./pages/Glossary";
import Landing from "./pages/Landing";
import Overview from "./pages/Overview";
import Playground from "./pages/Playground";
import Submit from "./pages/Submit";
import Theory from "./pages/Theory";
import Training from "./pages/Training";
import Transfer from "./pages/Transfer";
import StepPage from "./pages/StepPage";

export const routes: RouteObject[] = [
  { path: "/", element: <Landing /> },
  { path: "/glossary", element: <Glossary /> },
  { path: "/:stepId", element: <StepPage /> },
  {
    path: "/legacy",
    element: <Shell />,
    children: [
      { index: true, element: <Overview /> },
      { path: "theory", element: <Theory /> },
      { path: "theory/:topic", element: <Theory /> },
      { path: "assignment", element: <Assignment /> },
      { path: "playground", element: <Playground /> },
      { path: "transfer", element: <Transfer /> },
      { path: "training", element: <Training /> },
      { path: "compare", element: <Compare /> },
      { path: "submit", element: <Submit /> },
    ],
  },
];
