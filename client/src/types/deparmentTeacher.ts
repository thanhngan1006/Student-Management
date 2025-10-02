import { Teacher } from "./teacher";

export type DepartmentTeacher = {
  teacher: Teacher;
  subject: string;
  departmentId: number;
};
