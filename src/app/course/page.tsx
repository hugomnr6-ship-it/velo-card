
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CourseClient from "./CourseClient";

export default async function CoursePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <CourseClient />;
}
