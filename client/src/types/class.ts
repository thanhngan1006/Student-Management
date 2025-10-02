// export interface ClassTypes {
//   id: string;
//   class_name: string;
//   classTeacher: string;
//   classMember: string[];
//   updatedAt: string;
//   class_id: string;
// }

export interface ClassTypes {
  id?: string;
  class_id: string;
  class_name: string;
  name?: string;
  class_teacher?: string;
  class_member?: string[];
  updatedAt?: string;
}
