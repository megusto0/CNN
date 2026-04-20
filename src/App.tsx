import { useRoutes } from "react-router-dom";
import { routes } from "./routes";
import usePageTitle from "./lib/usePageTitle";

export default function App() {
  usePageTitle();
  const element = useRoutes(routes);
  return element;
}
