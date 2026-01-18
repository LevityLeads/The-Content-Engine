import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the inputs page (main entry point)
  redirect("/inputs");
}
