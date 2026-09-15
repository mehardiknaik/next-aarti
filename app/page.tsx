import type { Metadata } from "next";
import Welcome from "./components/Welcome";

export const metadata: Metadata = {
  title: "आरती संग्रह | Aarti Sangrah",
  description: "मराठी आरत्या व स्तोत्र संग्रह",
};

export default function Home() {
  return <Welcome />;
}
